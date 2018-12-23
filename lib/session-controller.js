/**
 * Session controller
 */

const CONFIG = require(process.env.PWD + '/lib/config');

const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

// db store
const STORE = new MongoDBStore({
  uri: CONFIG.DB_CONNECTION_URI,
  databaseName: CONFIG.DB_NAME,
  collection: CONFIG.SESSION_DB_COLLECTION
});

// session cookie
const SESSION_PARAMS = {
  secret: CONFIG.SESSION_SECRET,
  store: STORE,
  name: CONFIG.SESSION_COOKIE_NAME,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 40 * Date.DAY,

    // cookie.secure wymaga ustawienia przy reverse-proxy
    // X-Forwarded-Proto: https
    //
    // W Apache2:
    // RequestHeader set X-Forwarded-Proto "https"
    //
    // W ngnix:
    // proxy_set_header X-Forwarded-Proto https;
    //
    // https://github.com/expressjs/session/issues/281#issuecomment-191359194
    secure: CONFIG.MODE_PRODUCTION
  }
};

/**
 * Support for express
 */
exports.support = session(SESSION_PARAMS);

/**
 * Returns true if given session is valid
 * 
 * @param {object} session Session from Express Request object
 * @returns {boolean} Verdict
 */
exports.isValid = function(session) {
  return session != null && session.id != null;
};

/**
 * Add intention
 * 
 * @param {object} session Session from Express Request object
 * @param {object} intention Intention
 */
exports.addIntention = function(session, intention) {
  if (session.intentions == null) {
    session.intentions = [];
  }
  session.intentions.push(intention._id);
}

/**
 * Join prayer
 * 
 * @param {object} session Session from Express Request object
 * @param {object} intention Intention
 */
exports.joinPrayer = function(session, intention) {
  if (session.joined == null) {
    session.joined = [];
  }
  session.joined.push(intention._id);
}

/**
 * Returns true if session user has joined given intention
 * 
 * @param {object} session Session from Express Request object
 * @param {object} intention Intention
 * @returns {boolean} Verdict
 */
function hasJoined(session, intention) {
  return session != null && Array.isArray(session.joined) && session.joined.some((id) => intention._id.equals(id));
};

/**
 * Mark which intentions has been joined already
 * 
 * @param {object} session Session from Express Request object
 * @param {object[]} intentions Array of intentions
 */
exports.markJoined = function(session, intentions) {
  for (var i = 0; i < intentions.length; i++) {
    intentions[i].joined = hasJoined(session, intentions[i]);
  }
};
