/*
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
 *                               POLONIEX WEBSOCKET API
 *   GENERAL DESCRIPTION
 *     Get quotes from websocket.
 *     currencyList 변수에 코인 통화쌍을 추가하면 해당 통화를 subscribe하고 가격을 받아옴. 
 * 
 *   REFERENCE WEBSITE
 *     https://poloniex.com/support/api/
 * 
 *   SUPPORTED CURRENCY
 * 
 *   CREATED DATE, 2018.08.01
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
*/

/*
* redis table에 저장시 sorted set으로 저장해야 하는데 score가 소수점이라 정확한 값이 score에 저장되지 않음.
* 해당 score를 정수화 해서 저장 후 추출 시 소수점해야할듯.
*/


// npm modules.
const wsClient = require('ws-reconnect');
const redis    = require('redis');
const sleep    = require('sleep');
const _ = require('lodash');

// custom module or config.
const config = require('config');
const poloniexConfig = config.marketConfig.poloniex;
const heartBeatInterval = 60000;


/**
* @description Poloniex Websocket Object
*/

function PoloniexWS () {

  this.Market       = "POLONIEX";
  this.WebsocketURL = "wss://api2.poloniex.com";
  this.redisClient  = redis.createClient(config.redisConfig);
  this.RedisHeartBeatTable = `${this.Market}_HEARTBEAT`;
  this.heartBeatTimestamp  = new Date().getTime();
}

PoloniexWS.prototype.getQuotes = function() {

  const self        = this;
  const wsclient    = new wsClient(this.WebsocketURL, poloniexConfig.connection_option);

  // websocket heartBeat func.
  const heartBeat = () => {
    const curr = new Date().getTime();

    if(heartBeatInterval < (curr - this.heartBeatTimestamp)) {
      self.redisClient.set(this.RedisHeartBeatTable, false);
    }
    else {
      self.redisClient.set(this.RedisHeartBeatTable, true);
    }
  }

  // websocket client start.
  wsclient.start();

  wsclient.on("connect", function(connection){
    console.log(`${self.Market} Websocket Client Connected`);

    _.forEach(poloniexConfig.crawl_list, (element, channelID) => {

      wsclient.socket.send(JSON.stringify({
        command : "subscribe",
        channel : element.name
      }));
      sleep.msleep(100);

    });

    // heartBeat script start.
    setInterval(heartBeat, heartBeatInterval);

  });

  wsclient.on("message",function(message){
    const parseJson = JSON.parse(message.toString());



    if(parseJson[0] === 1010) {
      // Hearbeat
      console.log(parseJson);
    }
    else {
      const [code, timestamp, orderbook] = [parseJson[0],parseJson[1],parseJson[2]]

      const RedisAskHashTable = `${self.Market}_${poloniexConfig.crawl_list[code].redisName}_ASK`;          
      const RedisBidHashTable = `${self.Market}_${poloniexConfig.crawl_list[code].redisName}_BID`;

      orderbook.forEach(element => {
        if(element[0] === 'i') {

          // Snapshot orderbook.
          self.redisClient.del(RedisAskHashTable);
          _.forEach(element[1].orderBook[0], (volume, price) => {
            self.redisClient.hset(RedisAskHashTable,price,volume);
          });

          self.redisClient.del(RedisBidHashTable);
          _.forEach(element[1].orderBook[1], (volume, price) => {
            self.redisClient.hset(RedisBidHashTable,price,volume);
          });

        }
        else if(element[0] === 'o') {
          
          // hearBeat timestamp.
          self.heartBeatTimestamp = new Date().getTime();
          
          // Update orderbook.
          orderbook.forEach(element => {
            const [type, price, volume] = [element[1], element[2], element[3]];

            if(type === 0){
              // ASK orderbook update
              if(Number(volume) == 0) {
                self.redisClient.hdel(RedisAskHashTable, price);
              }
              else {
                self.redisClient.hset(RedisAskHashTable, price, volume);
              }
            }
            else {
              // BID orderbook update
              if(Number(volume) == 0) {
                self.redisClient.hdel(RedisBidHashTable, price);
              }
              else {
                self.redisClient.hset(RedisBidHashTable, price, volume);
              }
            }

          });

        }
      });
    }

  });

}

module.exports = PoloniexWS

/* get orderbook code
const redis    = require('redis');
const config = require('./src/config');
const _ = require('lodash');

const redisClient  = redis.createClient(config.redisConfig);

let index = 0;
let price = 0;
let volume = 0;

function main() {

  redisClient.hgetall("POLONIEX_ETHBTC_ASK", function (err, obj) {
    // console.log(typeof obj);
    const askArr = _.map(obj, (volume, price) => {
      return {
        price : price,
        volume : volume
      };
    });
    const askSorted = _.sortBy(askArr, ['price', 'volume']);

    console.log(askSorted[0]); // first
    console.log(askSorted[1]);

  });

  redisClient.hgetall("POLONIEX_ETHBTC_BID", function (err, obj) {
    const askArr = _.map(obj, (volume, price) => {
      return {
        price : price,
        volume : volume
      };
    });
    const askSorted = _.sortBy(askArr, ['price', 'volume']);
    askSorted.reverse();
    console.log(askSorted[0]); // first
    console.log(askSorted[1]);

  });

}



setInterval(main, 100);



*/