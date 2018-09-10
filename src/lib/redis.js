const config   = require('config');
const redis    = require('redis');
const bluebird = require('bluebird');

bluebird.promisifyAll(redis);


module.exports = {
  getQuotesConn : () => {
    return redis.createClient(config.redisQuotes);
  },

  getAggregateConn : () => {
    return redis.createClient(config.redisAggregate);
  },

  getMultiTable : (redisClient, tableArr) => {
    return redisClient.multi(tableArr).execAsync();
  },
  
  getHashTable : (redisClient, table) => {
    return redisClient.hgetallAsync(table);
  },

  setSortedTable : (redisClient, table, score, description) => {
    redisClient.zadd(table, score, description);
  },

  delTable : (redisClient, table) => {
    redisClient.del(table);

  }
  



}