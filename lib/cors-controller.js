/**
 * CORS Controller 
 */

const CONFIG = require(process.env.PWD + '/lib/config');

const ALLOWED_ORIGINS = CONFIG.MODE_PRODUCTION ? ['https://omodlmy.net'] : ['http://localhost:8080'];

module.exports = function(req, res, next) {
  // Website you wish to allow to connect
  var origin = req.headers.origin;

  if (ALLOWED_ORIGINS === '*') {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (ALLOWED_ORIGINS.indexOf(origin) > -1) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // intercept OPTIONS method
  if (req.method == 'OPTIONS') {
    res.sendStatus(200);
  } else {
    // Pass to next layer of middleware
    next();
  }
};
