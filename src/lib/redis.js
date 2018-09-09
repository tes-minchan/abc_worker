const config   = require('config');
const redis    = require('redis');
const bluebird = require('bluebird');

bluebird.promisifyAll(redis);

const redisClient  = redis.createClient(config.redisQuotes);
const redisClientAggregate = redis.createClient(config.redisAggregate);

module.exports = {

  getMultiTable : (tableArr) => {
    return redisClient.multi(tableArr).execAsync();
  },


  getHashTable : (table) => {
    return redisClient.hgetallAsync(table);
  },

  setSortedTable : (table, score, description) => {
    redisClientAggregate.zadd(table, score, description);
  },

  getSortedTable : (table, orderby) => {

  },

  delTable : (table, dbIndex) => {
    if(dbIndex === 0) {
      redisClient.del(table);
    }
    else if(dbIndex === 1){
      redisClientAggregate.del(table);
    }

  }
  



}