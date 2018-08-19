/*
 * api.js
 * 
 * This file contains handling all api calls
 * 
 * @author Marek Sierociński
 */

const mongo = require('./mongo');

const {ObjectId} = require('mongodb');

mongo.getDB(); // init connection

function _req(req) {
  if ((req.query.limit != null && (isNaN(req.query.limit) || req.query.limit < 0))
    || (req.query.offset != null && (isNaN(req.query.offset) || req.query.offset < 0))) {
    return false;
  }

  if (req.query.limit == null) {
    req.query.limit = 25;
  } else {
    req.query.limit = parseInt(req.query.limit);
  }

  if (req.query.offset == null) {
    req.query.offset = 0;
  } else {
    req.query.offset = parseInt(req.query.offset);
  }
  return true;
}

function getData(collectionName, sort) {
  if (sort == null) {
    sort = {};
  }

  return function (req, res) {
    if (!_req(req)) {
      res.sendStatus(400);
      return;
    }

    mongo.getDB(function (db) {
      db.collection(collectionName).find().skip(
        req.query.offset
      ).limit(
        req.query.limit
      ).sort(
        sort
      ).toArray(function (err, items) {
        res.setHeader('Content-Type', 'application/json');
        res.send(items);
      });
    });
  };
}

function isValidString(val) {
  return val != null && (val + '').length > 0;
}


// exports
exports.getIntentions = function (req, res) {
  if (!_req(req)) {
    res.sendStatus(400);
    return;
  }

  mongo.getDB(function (db) {
    db.collection('intentions').find().skip(
      req.query.offset
    ).limit(
      req.query.limit
    ).sort({
      createTime: -1
    }).toArray(function (err, items) {
      for (var i = 0; i < items.length; i++) {
        items[i].joined = req.session != null && Array.isArray(req.session.joined) && req.session.joined.some(function (id) {
          return items[i]._id.equals(id);
        });
      }

      res.setHeader('Content-Type', 'application/json');
      res.send(items);
    });
  });
};

exports.postIntention = function (req, res) {
  if (!isValidString(req.body.content) || req.body.content.length < 7 || req.body.content.length > 256) {
    res.sendStatus(400);
    return;
  }

  if (req.session == null || req.session.id == null) {
    res.sendStatus(403);
    return;
  }

  // author check
  var author = null;
  if (typeof req.body.author == 'string') {
    author = req.body.author.trim();
    if (author.length == 0) {
      author = null;
    }
  }

  // content
  var content = req.body.content.trim().replace(/\n{2,}/g, "\n");

  mongo.getDB(function (db) {
    db.collection('intentions').find({
      authorHash: req.session.id,
      createTime: {
        $gt: Date.now() - Date.DAY
      }
    }, {
      createTime: true
    }).toArray(function (err, items) {
      if (items.length >= 5) {
        res.status(429);
        res.send({
          createTime: Math.min.apply(Math, items.map(function (x) {
            return x.createTime;
          }))
        });
      } else {
        db.collection('intentions').insertOne({
          content: content,
          author: author,
          authorHash: req.session.id,
          createTime: Date.now(),
          praying: 0
        }, function (err, resp) {
          if (req.session.intentions == null) {
            req.session.intentions = [];
          }
          var id = resp.ops[0]._id;
          req.session.intentions.push(id);

          res.setHeader('Content-Type', 'application/json');
          res.status(201).send({
            id: id
          });
        });
      }
    });
  });
};

exports.postJoinPrayer = function (req, res) {
  if (req.params.id == null) {
    res.sendStatus(400);
    return;
  }

  if (!ObjectId.isValid(req.params.id)) {
    res.sendStatus(404);
  }

  mongo.getDB(function (db) {
    db.collection('intentions').findOneAndUpdate({
      _id: ObjectId(req.params.id)
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
        res.sendStatus(404);
      } else {
        if (req.session.joined == null) {
          req.session.joined = [];
        }
        req.session.joined.push(resp.value._id);
        res.status(201).send(resp.value);
      }
    });
  });
};
