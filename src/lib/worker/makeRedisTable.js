const marketConfig = require('config').marketConfig;
const redisClient  = require('lib/redis');

function makeRedisTable() {
  this.redisClient = redisClient;
}

makeRedisTable.prototype.getKoreaCoinTable = function(subscribe) {
  return new Promise((resolve)=> {
    let redis_table = [];

    marketConfig.marketListKorea.forEach(market => {
      marketConfig[market].crawl_list.forEach(coin => {
        if(!subscribe) {
          // All coin add.
          redis_table.push(['hgetall',`${market.toUpperCase()}_${coin}KRW_ASK`]);
          redis_table.push(['hgetall',`${market.toUpperCase()}_${coin}KRW_BID`]);  
        }
        else {
          // check subscribe market && coin.
          if(subscribe.hasOwnProperty(coin)) {
            if(subscribe[coin].market.includes(market.toUpperCase())) {
              redis_table.push(['hgetall',`${market.toUpperCase()}_${coin}KRW_ASK`]);
              redis_table.push(['hgetall',`${market.toUpperCase()}_${coin}KRW_BID`]);  
            }
          }
        }
      })
    });

    resolve(redis_table)
  });

}

makeRedisTable.prototype.getAbroadCoinTable = function(subscribe) {
  return new Promise((resolve)=> {
    let redis_table = [];

    marketConfig.marketListAbroad.forEach(market => {
      marketConfig[market].crawl_list.forEach(coin => {
        if(!subscribe) {
          // All coin add.
          redis_table.push(['hgetall',`${market.toUpperCase()}_${coin}_ASK`]);
          redis_table.push(['hgetall',`${market.toUpperCase()}_${coin}_BID`]);
        }
        else {
          // TO DO except coin list.

        }

      })
    });
    resolve(redis_table)
  });

}

module.exports = new makeRedisTable();


