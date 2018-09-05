/*
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
 *                               BITHUMB REST API
 *   GENERAL DESCRIPTION
 *     Get quotes from REST API.
 *     currencyList 변수에 코인 통화쌍을 추가하면 해당 코인 가격을 Redis Table에 저장함.
 *
 *   REFERENCE WEBSITE
 *     https://api.bithumb.com/
 * 
 *   SUPPORTED CURRENCY
 *     BTC, ETH, DASH, LTC, ETC, XRP, BCH, XMR, ZEC, QTUM, BTG, EOS, ICX, VEN, TRX, ELF, MITH, MCO, OMG, 
 *     KNC, GNT, HSR, ZIL, ETHOS, PAY, WAX, POWR, LRC, GTO, STEEM, STRAT, ZRX, REP, AE, XEM, SNT, ADA (기본값: BTC), ALL(전체)
 * 
 *   CREATED DATE, 2018.08.17
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
*/

// npm modules.
const redis = require('redis');
const axios = require('axios');

// custom module or config.
const config      = require('config');
const redisClient = redis.createClient(config.redisConfig);

function BithumbRESTAPI () {

  this.Market       = "BITHUMB";
  this.RestAPIURL   = "https://api.bithumb.com/public/orderbook/ALL";
}

BithumbRESTAPI.prototype.getQuotes = function(timeInterval) {
  console.log(`${this.Market} REST API Start.`);

  const self = this;
  const RedisHeartBeatTable = `${this.Market}_HEARTBEAT`;

  const crawlingQuotes =  () => {
    axios.get(this.RestAPIURL)
    .then(response => {
      if(response.status === 200) {
        redisClient.set(RedisHeartBeatTable,true);
        const parseCoin = Object.keys(response.data.data);

        _saveOrderbook(self.Market, parseCoin, response.data.data);

      }
    })
    .catch(error => {
      if(error) {
        console.log(`${self.Market} Request Error`);
        console.log(error);
        redisClient.set(RedisHeartBeatTable, false);
      }
    });
  }

  setInterval(crawlingQuotes, timeInterval);
}

/**  
  * @typedef _saveOrderbook  
  * @param  
  * @description 웹소켓에서 받은 data를 coin 별로 Redis Table에 저장.
  * @returns 
*/ 

function _saveOrderbook (market, coinArr, orderbookObj) {
  coinArr.forEach(coin => {
    if(coin === 'timestamp' || coin === 'payment_currency') 
    return;
        
    const RedisAskHashTable = `${market}_${coin}KRW_ASK`;

    redisClient.del(RedisAskHashTable);
    orderbookObj[coin].asks.forEach(orderbook => {
      redisClient.hset(RedisAskHashTable,orderbook.price,orderbook.quantity);
    });

    const RedisBidHashTable = `${market}_${coin}KRW_BID`;
    redisClient.del(RedisBidHashTable);
    orderbookObj[coin].bids.forEach(orderbook => {
      redisClient.hset(RedisBidHashTable,orderbook.price,orderbook.quantity);
    });

  });

}


module.exports = BithumbRESTAPI;