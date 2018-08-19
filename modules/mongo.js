/*
 * mongo.js
 * 
 * Simple mongo connect module
 * 
 * @author Marek Sierociński
 */

var MONGO_HOST = process.env.npm_package_config_mongodb_host || 'localhost';
var MONGO_PORT = process.env.npm_package_config_mongodb_port || 27017;
var MONGO_DB = process.env.npm_package_config_mongodb_db;
var MONGO_URI = 'mongodb://' + MONGO_HOST + ':' + MONGO_PORT + '/' + MONGO_DB;

module.exports = {
  MONGO_HOST: MONGO_HOST,
  MONGO_PORT: MONGO_PORT,
  MONGO_DB: MONGO_DB,
  MONGO_URI: MONGO_URI,

  _db: null,

  connect: function (onConnect) {
    var MongoClient, that;

    that = this;
    MongoClient = require('mongodb').MongoClient;

    MongoClient.connect(this.MONGO_URI, {
      useNewUrlParser: true
    }, function (err, client) {
      console.log('Connecting to ' + that.MONGO_URI);
      if (err) {
        console.log('MONGODB CONNECTION ERROR!');
        throw err;
      }
      onConnect(client);
    });
  },

  getClient: function (then) { // singleton
    var that = this;

    if (then == null) {
      then = function () {

      };
    }

    if (this._client == null) {
      this.connect(function (client) {
        that._client = client;
        then(that._client);
      });
    } else {
      then(this._client);
    }
  },

  getDB: function (then) {
    var that = this;

    if (then == null) {
      then = function () {

      };
    }

    this.getClient(function (client) {
      then(client.db(that.MONGO_DB));
    });
  },

  closeClient: function () {
    if (this._client == null) {
      // console.log('Nothing to close');
    } else {
      this._client.close();
      this._client = null;
    }
  },

  closeAndExit: function () {
    this.closeClient();
    process.exit(0);
  }
};
