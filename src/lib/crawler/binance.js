/*
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
 *                               BINANCE WEBSOCKET API
 *   GENERAL DESCRIPTION
 *     Get quotes from websocket.
 *     
 * 
 *   REFERENCE WEBSITE
 *     https://github.com/binance-exchange/binance-official-api-docs/blob/master/web-socket-streams.md
 * 
 *   SUPPORTED CURRENCY
 *    
 * 
 *   CREATED DATE, 2018.09.05
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
*/



// npm modules.
const wsClient = require('ws-reconnect');
const redis    = require('redis');
const axios    = require('axios');

// custom module or config.
const config = require('config');
const binanceConfig = config.marketConfig.binance;
const heartBeatInterval = 60000;


/**
* @description Binance Websocket Object
*/

function BinanceWS () {

  this.Market       = "BINANCE";
  this.WebsocketURL = "wss://stream.binance.com:9443/stream?streams=";
  this.redisClient  = redis.createClient(config.redisConfig);

  this.RedisHeartBeatTable = `${this.Market}_HEARTBEAT`;
  this.heartBeatTimestamp  = new Date().getTime();

  binanceConfig.crawl_list.forEach(async (element) => {
    this.WebsocketURL += `${element.toLowerCase()}@depth/`;
    await orderbookSnapshot(this.Market, element, this.redisClient);
  });


}


const orderbookSnapshot = function(market, currency, redisClient) {
  return new Promise(async (resolve)=> {

    const url = `https://www.binance.com/api/v1/depth?symbol=${currency}&limit=1000`;
    const RedisAskHashTable = `${market}_${currency}_ASK`;
    const RedisBidHashTable = `${market}_${currency}_BID`;

    axios.get(url)
    .then(response => {

      redisClient.del(RedisAskHashTable);
      for(const element of response.data.asks) {
        redisClient.hset(RedisAskHashTable,element[0],element[1]);
      }
      redisClient.del(RedisBidHashTable);
      for(const element of response.data.bids) {
        redisClient.hset(RedisBidHashTable,element[0],element[1]);
      }
      resolve();
    })
    .catch(error => {
      console.log(error);
  
    });
  });
}

BinanceWS.prototype.getQuotes = function() {

  const self        = this;
  const wsclient    = new wsClient(this.WebsocketURL, binanceConfig.connection_option);

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

    // heartBeat script start.
    setInterval(heartBeat, heartBeatInterval);
  });


  wsclient.on("message",function(message){
    let parseMessage = JSON.parse(message.toString()).data;

    // hearBeat timestamp.
    self.heartBeatTimestamp = new Date().getTime();

    const RedisAskHashTable = `${self.Market}_${parseMessage.s}_ASK`;
    const RedisBidHashTable = `${self.Market}_${parseMessage.s}_BID`;

    // ask orderbook
    parseMessage.a.forEach(element => {
      if(Number(element[1]) === 0) {
        self.redisClient.hdel(RedisAskHashTable, element[0]);
      }
      else {
        self.redisClient.hset(RedisAskHashTable, element[0], element[1]);
      }
    });

    // bid orderbook
    parseMessage.b.forEach(element => {
      if(Number(element[1]) === 0) {
        self.redisClient.hdel(RedisBidHashTable, element[0]);
      }
      else {
        self.redisClient.hset(RedisBidHashTable, element[0], element[1]);
      }
    });

    
  });

}

module.exports = BinanceWS;



/* get orderbook code.
const redis    = require('redis');
const config = require('./src/config');
const _ = require('lodash');

const redisClient  = redis.createClient(config.redisConfig);

let index = 0;
let price = 0;
let volume = 0;

function main() {

  redisClient.hgetall("BINANCE_ETHBTC_ASK", function (err, obj) {
    // console.log(typeof obj);
    const askArr = _.map(obj, (volume, price) => {
      return {
        price : price,
        volume : volume
      };
    });
    const askSorted = _.sortBy(askArr, ['price', 'volume']);

    console.log(askSorted[1]);
    console.log(askSorted[0]);

  });

  redisClient.hgetall("BINANCE_ETHBTC_BID", function (err, obj) {
    const askArr = _.map(obj, (volume, price) => {
      return {
        price : price,
        volume : volume
      };
    });
    const askSorted = _.sortBy(askArr, ['price', 'volume']);
    askSorted.reverse();
    console.log(askSorted[0]);
    console.log(askSorted[1]);

  });

}



setInterval(main, 100);

*/