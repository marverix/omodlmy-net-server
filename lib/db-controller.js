/**
 * DB controller
 */

// DB
const { ObjectId } = require('mongodb');
const dbDriver = require(process.env.PWD + '/lib/db-driver');

// JSON schema valdidator
const Ajv = require('ajv');
const ajv = new Ajv();

// Prepare schema validation
const intentionSchema = require(process.env.PWD + '/lib/schema/intention.json');
var validateIntention = ajv.compile(intentionSchema);

// Define user daily limit
const USER_DAILY_LIMIT = 5;
const USER_COOLDOWN = 5 * Date.SECOND;


/**
 * Get list of intentions
 * 
 * @param {object} query Query
 * @returns {Promise} Promise
 */
exports.getIntentions = function(query) {
  return new Promise(function(resolve, reject) {
    dbDriver.intentions().find().skip(query.offset).limit(query.limit).sort({
      createTime: -1
    }).toArray(function (err, items) {
      resolve(items);
    });
  });
};

/**
 * Validate user intentions limit
 * 
 * @param {object} session Session from Express Request object
 * @returns {Promise} Promise
 */
exports.validateUserLimit = function(session) {
  return new Promise(function(resolve, reject) {
    dbDriver.intentions().find({
      authorHash: session.id,
      createTime: {
        $gt: Date.now() - Date.DAY
      }
    }, {
      createTime: true
    }).sort({
      createTime: -1
    }).toArray(function (err, items) {

      // check only if there are any items
      if (items.length > 0) {

        // exceeded daily limit
        if (items.length >= USER_DAILY_LIMIT) {
          reject({
            msg: 'ERROR_DAILY_LIMIT',
            createTime: items[items.length - 1].createTime
          });

        // too quick - cooldown
        } else if(Date.now() - items[0].createTime < USER_COOLDOWN) {
          reject({
            msg: 'ERROR_COOLDOWN',
            createTime: items[0].createTime
          });
        }

      }

      resolve();
    });
  });
};

/**
 * Add intention
 * 
 * @param {object} intention Intention
 * @returns {Promise} Promise
 */
exports.addIntention = function(intention, session) {
  return new Promise(function(resolve, reject) {
    // validate by json schema
    var valid = validateIntention(intention);
    if (!valid) {
      reject(validateIntention.errors);
      return;
    }

    // author check
    var author = null;
    if (typeof intention.author == 'string') {
      author = intention.author.trim();
      if (author.length == 0) {
        author = null;
      }
    }

    // content
    var content = intention.content.trim().replace(/\n{2,}/g, "\n");

    // insert
    dbDriver.intentions().insertOne({
      content: content,
      author: author,
      authorHash: session.id,
      createTime: Date.now(),
      praying: 0
    }, function (err, resp) {
      resolve(resp.ops[0]);
    });

  });
};

/**
 * Join prayer to intention with given ID
 * 
 * @param {string} id Intention ID
 * @returns {Promise} Promise
 */
exports.joinPrayer = function(id) {
  return new Promise(function(resolve, reject) {
    if (id == null || !ObjectId.isValid(id)) {
      reject('ERROR_ID_INVALID');
      return;
    }

    dbDriver.intentions().findOneAndUpdate({
      _id: ObjectId(id)
    }, {
      $inc: {
        praying: 1
      }
    }, {
      projection: {
        praying: true
      },
      returnOriginal: false
    }, function (err, resp) {
      if (resp.value == null) {
        reject('ERROR_ID_NOT_EXISTS');
      } else {
        resolve(resp.value);
      }
    });
  });
};
