/*
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
 *                               GOPAX REST API
 *   GENERAL DESCRIPTION
 *     Get quotes from REST API.
 *     currencyList 변수에 코인 통화쌍을 추가하면 해당 코인 가격을 Redis Table에 저장함.
 *
 *   REFERENCE WEBSITE
 *     https://gopaxapi.github.io/gopax/
 *     Limit : 20 req per 1sec.
 * 
 *   SUPPORTED CURRENCY
 *     Refer to https://api.gopax.co.kr/trading-pairs
 * 
 *   CREATED DATE, 2018.08.17
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
*/

// npm modules.
const redis = require('redis');
const axios = require('axios');

// custom module or config.
const config = require('config');

function GopaxRESTAPI () {

  this.Market       = "GOPAX";
  this.RestAPIURL   = "https://api.gopax.co.kr/trading-pairs";
  this.TimeInternal = 1000; // ms
}

GopaxRESTAPI.prototype.getQuotes = function(CURRENCY, timeInterval) {
  console.log(`${this.Market} REST API Start. ${CURRENCY}/KRW`);

  const redisClient = redis.createClient(config.redisConfig);
  const self = this;

  const RedisHeartBeatTable = `${this.Market}_HEARTBEAT`;
  let checkGetResponse = true;

  const crawlingQuotes = () => {
    if(checkGetResponse) {
      checkGetResponse = !checkGetResponse;

      axios.get(`${this.RestAPIURL}/${CURRENCY}-KRW/book`)
        .then(response => {
          checkGetResponse = !checkGetResponse;

          if(response.status === 200) {
            redisClient.set(RedisHeartBeatTable,true);
  
            const RedisAskHashTable = `${self.Market}_${CURRENCY}KRW_ASK`;
            const RedisBidHashTable = `${self.Market}_${CURRENCY}KRW_BID`;
            
            redisClient.del(RedisAskHashTable);
            response.data.ask.forEach((orderbook, index) => {
              if(index > 20) {
                return;
              }
              redisClient.hset(RedisAskHashTable,orderbook[1],orderbook[2]);
            });
    
            redisClient.del(RedisBidHashTable);
            response.data.bid.forEach((orderbook, index) => {
              if(index > 20) {
                return;
              }
              redisClient.hset(RedisBidHashTable,orderbook[1],orderbook[2]);
            });
          }
  
        })
        .catch(error => {
          console.log(`${self.Market} Request Error ${CURRENCY}`);
          checkGetResponse = !checkGetResponse;
          redisClient.set(RedisHeartBeatTable, false);
        })
    }
  }

  setInterval(crawlingQuotes, timeInterval);

}

module.exports = GopaxRESTAPI;
