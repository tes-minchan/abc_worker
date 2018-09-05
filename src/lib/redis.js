const config   = require('config');
const redis    = require('redis');
const bluebird = require('bluebird');

bluebird.promisifyAll(redis);

const redisClient = redis.createClient(config.redisConfig);

module.exports = {

  getMultiTable : (tableArr) => {
    return redisClient.multi(tableArr).execAsync();
  },


  getHashTable : (table) => {
    return redisClient.hgetallAsync(table);
  }
  



}