/*
 * DB Driver
 * 
 * Purpose of this file is to provide simple handlers for collections
 * and have one MongoDB connection handler for whole service.
 */

const MongoClient = require('mongodb').MongoClient;
const CONFIG = require(process.env.PWD + '/lib/config');

var activeClient = null;

/**
 * Debug
 * 
 * @param {string} msg Debug message
 */
function debug(msg) {
  console.log(`db-driver: ${msg}`);
}

/**
 * Init
 * 
 * @returns {Promise} Promise
 */
function init() {
  return new Promise(function(resolve, reject) {
    getClient().then(function(client) {
      activeClient = client;
      resolve();
    }).catch(reject);
  });
}

/**
 * Get client
 * 
 * @returns {Promise} Client promise
 */
function getClient() {
  return new Promise(function(resolve, reject) {
    MongoClient.connect(CONFIG.DB_CONNECTION_URI, {
      useNewUrlParser: true
    }, function (err, client) {
      debug(`Connecting to ${CONFIG.DB_CONNECTION_URI}`);

      // handle error
      if (err) {
        reject(`Connection error! ${err}`);

      // success
      } else {
        debug(`Connected!`);
        resolve(client);
      }
    });
  });
}

/**
 * Get DB
 * 
 * @returns {Object} Db
 */
function getDb() {
  return activeClient.db(CONFIG.DB_NAME);
}

/**
 * Get collection with given collectionName
 * 
 * @param {string} collectionName Collection name
 */
function getCollection(collectionName) {
  return getDb().collection(collectionName);
}

// exports
module.exports = {
  init,
  getDb,
  getCollection,
  
  intentions: function() {
    return getCollection('intentions');
  }
};
