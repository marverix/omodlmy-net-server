/*
 * api-server.js
 * 
 * @author Marek Sierociński
 */

// require
require('finka');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const api = require('./modules/api');
const mongo = require('./modules/mongo');

const store = new MongoDBStore({
  uri: mongo.MONGO_URI,
  databaseName: mongo.MONGO_DB,
  collection: 'sessions'
});

// start
const app = express();

// init vars
const PORT = process.env.npm_package_config_port;
const MODE_PRODUCTION = app.get('env') === 'production';
const MODE_VIRTUAL = app.get('env') === 'virtual';
const SESSION_SECRET = fs.readFileSync('.session-secret', 'utf-8');

// session cookie
var sessionParams = {
  secret: SESSION_SECRET,
  store: store,
  name: 'prayerHash',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 40 * Date.DAY
  }
};

var allowedOrigins = null;
var bindAddr = null;

if (MODE_PRODUCTION) {
  app.set('trust proxy', 1);

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
  sessionParams.cookie.secure = true;

  allowedOrigins = ['https://omodlmy.net'];
  bindAddr = '127.0.0.1';
} else {
  allowedOrigins = ['http://127.0.0.1:8080', 'http://localhost:8080'];

  if (MODE_VIRTUAL) {
    allowedOrigins.push('http://172.22.22.22:8080');
  } else {
    var ip = require('ip');
    allowedOrigins.push('http://' + ip.address() + ':8080');
  }

  bindAddr = '0.0.0.0';
}

app.use(session(sessionParams));

// enable cors
app.use(function (req, res, next) {
  // Website you wish to allow to connect
  var origin = req.headers.origin;
  if (allowedOrigins.indexOf(origin) > -1) {
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
});

// secure
if (MODE_PRODUCTION) {
  app.use(helmet());
}

// body parser for POST data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// handle calls
app.get('/api/intentions', api.getIntentions);
app.post('/api/intentions', api.postIntention);
app.post('/api/join-prayer/:id', api.postJoinPrayer);

// default
app.use(function (req, res) {
  // fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  res.sendStatus(404);
});

// listen
app.listen(PORT, bindAddr, function () {
  console.log('Webservice started! Listening on port ' + PORT);
});
