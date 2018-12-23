/*
 * Main API Server file
 */

// require
require('finka');

const express = require('express');
const helmet = require('helmet');

const CONFIG = require(process.env.PWD + '/lib/config');
const api = require(process.env.PWD + '/lib/api');

const dbDriver = require(process.env.PWD + '/lib/db-driver');
const corsController = require(process.env.PWD + '/lib/cors-controller');
const sessionController = require(process.env.PWD + '/lib/session-controller');

// init app
const app = express();

// always response with JSON
app.use(function (req, res, next) {
  res.header('Content-Type', 'application/json; charset=utf-8');
  next();
});

// onlt for production mode
if (CONFIG.MODE_PRODUCTION) {
  // trust proxy
  app.set('trust proxy', 1);

  // secure - use helmet
  app.use(helmet());
}

// session
app.use(sessionController.support);

// cors
app.use(corsController);

// JSON support
app.use(express.json());

// POST data
app.use(express.urlencoded({ extended: true }));

// support internal errors
app.use(api.supportInternalErrors);

// handle calls
app.get('/api/intentions', api.getIntentions);
app.post('/api/intentions', api.postIntention);
app.post('/api/join-prayer/:id', api.postJoinPrayer);

// static files
app.use('/schema', express.static(process.env.PWD + '/lib/schema'));

// default
app.use(api.defaultResponse);

// init db driver
dbDriver.init().then(function() {
  // listen *after* db driver is ready - so we are sure that we have established connection
  // and we can handle incoming requests properly

  // listen
  app.listen(CONFIG.SERVER_PORT, CONFIG.SERVER_ADDR, function() {
    console.log(`api-server: Listening ${CONFIG.SERVER_ADDR}:${CONFIG.SERVER_PORT}`);
  });
}).catch(function() {
  process.exit(1);
});
