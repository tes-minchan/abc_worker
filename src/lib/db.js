var mysql  = require("mysql");
var config = require("config");

// IDEA: MySql Server INFO and Connection.
var mysqlconn = mysql.createPool(config.mysqlConfig);

module.exports = {
  getConnection: function(callback) {
    mysqlconn.getConnection(function(err, connection) {
      if (err) {
        return callback(err, connection);
      } else {
        return callback(null, connection);
      }
    });
  },

  releaseConnection: function(connection, callback) {
    connection.release();
    callback(null);
  },

  doQuery: function(connection, sql_query, params, callback) {
    connection.query(sql_query, params, function(err, result) {
      if (err) {
        return callback(err, connection);
      } else {
        return callback(null, connection, result);
      }
    });
  },

  doMultiQuery: function(connection, sql_query, callback) {
    connection.query(sql_query, function(err, result) {

      if (err) {
        return callback(err, connection);
      } else {
        return callback(null, connection, result);
      }
    });
  },

  beginTRX: function(connection, callback) {
    connection.beginTransaction(function(err) {
      if (err) {
        return callback(err, connection);
      } else {
        return callback(null, connection);
      }
    });
  },

  doCommit: function(connection, callback) {
    connection.commit(function(err) {
      if (err) {
        return callback(err, connection);
      } else {
        callback(null, connection);
      }
    });
  },

  doRollback: function(connection, callback) {
    connection.rollback(function(err) {
      if (err) {
        return callback(err, connection);
      } else {
        callback(null, connection);
      }
    });
  }
};
