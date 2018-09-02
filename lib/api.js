/*
 * API
 * 
 * This file is responsible for handling incoming API calls
 */

const dbController = require(process.env.PWD + '/lib/db-controller');
const sessionController = require(process.env.PWD + '/lib/session-controller');

/**
 * Response with error
 * 
 * @param {object} res Express Response Object
 * @param {number} code HTTP status code
 * @param {string} msg Error message
 * @param {object} [additionalData] Additional data
 */
function responseWithError(res, code, msg, additionalData) {
  var response = {
    status: code,
    message: msg
  };

  if(additionalData != null) {
    Object.assign(response, additionalData);
  }

  res.status(code).send(response);
}

/**
 * Validates query and returns true if is valid
 * 
 * @param {object} query Express Request Query Object
 * @return {boolean} Verdict
 */
function validateQuery(query) {
  if(query.limit == null) {
    query.limit = 25;
  }

  if(query.offset == null) {
    query.offset = 0;
  }

  if(!isNumeric(query.limit) || !isNumeric(query.offset)) {
    return false;
  }

  query.limit = parseInt(query.limit);
  query.offset = parseInt(query.offset);

  if(query.limit < 0 || query.offset < 0) {
    return false;
  }

  return true;
}

/**
 * Get list of intentions
 */
exports.getIntentions = function(req, res) {
  if(!validateQuery(req.query)) {
    responseWithError(res, 400, 'ERROR_INVALID_QUERY');
    return;
  }

  dbController.getIntentions(req.query).then(function(intentions) {
    sessionController.markJoined(req.session, intentions);
    res.status(200).send(intentions);
  });
};

/**
 * Add new intention
 */
exports.postIntention = function(req, res) {
  if(!sessionController.isValid(req.session)) {
    responseWithError(res, 403, 'ERROR_INVALID_SESSION');
    return;
  }

  dbController.validateUserLimit(req.session).then(function() {
    dbController.addIntention(req.body, req.session).then(function(intention) {
      sessionController.addIntention(req.session, intention);
      res.status(201).send({ id: intention._id });
    }).catch(function(err) {
      responseWithError(res, 400, 'ERROR_INVALID_QUERY', {
        details: err
      });
    });
  }).catch(function(err) {
    responseWithError(res, 429, err.msg, {
      createTime: err.createTime
    });
  });
};

/**
 * Join prayer of intention
 */
exports.postJoinPrayer = function(req, res) {
  dbController.joinPrayer(req.params.id).then(function(intention) {
    sessionController.joinPrayer(req.session, intention);
    res.status(201).send(intention);
  }).catch(function(error) {
    responseWithError(res, error === 'ERROR_ID_NOT_EXISTS' ? 404 : 400, error);
  });
};

/**
 * Default response
 */
exports.defaultResponse = function(req, res) {
  res.sendStatus(404);
};

/**
 * Support internal errors
 */
exports.supportInternalErrors = function(err, req, res, next) {
  if(err instanceof SyntaxError && err.type === 'entity.parse.failed') {
    responseWithError(res, 400, 'ERROR_INVALID_JSON');
  } else {
    responseWithError(res, err.statusCode);
  }
};
