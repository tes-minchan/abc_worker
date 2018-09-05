const marketConfig = require('config').marketConfig;
const redisClient  = require('lib/redis');

function makeRedisTable() {

  this.redisClient = redisClient;

}

makeRedisTable.prototype.getCoinTable = function() {
  return new Promise((resolve)=> {
    let redis_table = [];

    marketConfig.marketListKorea.forEach(market => {
      marketConfig[market].crawl_list.forEach(coin => {
        redis_table.push(['hgetall',`${market.toUpperCase()}_${coin}KRW_ASK`]);
        redis_table.push(['hgetall',`${market.toUpperCase()}_${coin}KRW_BID`]);
      })
    });

    resolve(redis_table)
  });

}



module.exports = new makeRedisTable();


