/**
 * Config
 */

const fs = require('fs');

const MODE_PRODUCTION = process.env.NODE_ENV === 'production';
const MODE_VIRTUAL = process.env.NODE_ENV === 'virtual';

const SERVER_PORT = process.env.npm_package_config_port;
const SERVER_ADDR = MODE_PRODUCTION ? '127.0.0.1' : '0.0.0.0';

const DB_HOST = process.env.npm_package_config_mongodb_host || 'localhost';
const DB_PORT = process.env.npm_package_config_mongodb_port || 27017;
const DB_NAME = process.env.npm_package_config_mongodb_db;
const DB_CONNECTION_URI = `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`;

const SESSION_SECRET = fs.readFileSync(process.env.PWD + '/.session-secret', 'utf-8');
const SESSION_COOKIE_NAME = 'prayerHash';
const SESSION_DB_COLLECTION = 'sessions';

module.exports = {
  MODE_PRODUCTION,
  MODE_VIRTUAL,
  
  SERVER_PORT,
  SERVER_ADDR,

  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_CONNECTION_URI,

  SESSION_SECRET,
  SESSION_COOKIE_NAME,
  SESSION_DB_COLLECTION
};
