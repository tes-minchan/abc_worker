/*
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
 *                               COINONE WEBSOCKET API
 *   GENERAL DESCRIPTION
 *     Get quotes from websocket. 
 *     Coinone API is only for REST, so this websocket is parsed from webbroswer websocket.
 * 
 *   REFERENCE WEBSITE
 *     None.
 *
 *   SUPPORTED CURRENCY
 *     BTC, BCH, ETH, ETC, XRP, QTUM, LTC, IOTA, BTG, OMG, EOS, DATA, ZIL, KNC, ZRX
 * 
 *   CREATED DATE, 2018.08.17
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
*/

// npm modules.
const sleep    = require('sleep');
const wsClient = require('ws-reconnect');
const redis    = require('redis');
const _        = require('lodash');

// custom module or config.
const config = require('config');
const coinoneConfig = config.marketConfig.coinone;
const volumeCalculate  = 10000;

/**
* @description Coinone Websocket Object
*/

function CoinoneWS () {

  this.Market       = "COINONE";
  this.WebsocketURL = "wss://push.coinone.co.kr/socket.io/?EIO=3&transport=websocket";
  this.redisClient  = redis.createClient(config.redisConfig);

}

/**
* @description Coinone Websocket Connect Method
* @param "BTC/KRW, BTC : BASE_CURRENCY, KRW : QUOTE_CURRENCY"
*/
CoinoneWS.prototype.getQuotes = function(BASE_CURRENCY, QUOTE_CURRENCY) {

  const self = this;  

  const wsclient            = new wsClient(this.WebsocketURL, coinoneConfig.connection_option);
  const RedisAskHashTable   = `${this.Market}_${BASE_CURRENCY}${QUOTE_CURRENCY}_ASK`;
  const RedisBidHashTable   = `${this.Market}_${BASE_CURRENCY}${QUOTE_CURRENCY}_BID`;

  let init = true;
  
  // websocket client start.
  wsclient.start();

  wsclient.on("connect", function(connection){
    console.log(`${self.Market} Websocket Client Connected, ${BASE_CURRENCY}/${QUOTE_CURRENCY}`);

    let subscribe = '40/orderbook';
    wsclient.socket.send(subscribe);

    // set websocket send term.
    sleep.msleep(100);

    subscribe = `42/orderbook,["subscribe", "${BASE_CURRENCY}", ${_.find(coinoneConfig.coinInfo, (coin) => { return coin.name === BASE_CURRENCY; }).ws_option}]`;

    wsclient.socket.send(subscribe);

  });

  wsclient.on("message",function(get_data){
    const dataType = _getDataType(get_data);

    if(dataType === `42`) {
      const parseOrderbook = JSON.parse(get_data.replace('42/orderbook,',''));

      const ask_price = JSON.parse(parseOrderbook[1].ASK);
      const bid_price = JSON.parse(parseOrderbook[1].BID); 

      if(init) {

        // Reset ASK && BID Orderbook Redis Table.
        self.redisClient.del(RedisAskHashTable);
        self.redisClient.del(RedisBidHashTable);
        init = false;

        // Save ASK orderbook to redis table.
        ask_price.forEach(askItem => {
          const calculateVol = askItem.qty / volumeCalculate;
          self.redisClient.hset(RedisAskHashTable,askItem.price,calculateVol);
        });

        // Save BID orderbook to redis table.
        bid_price.forEach(bidItem => {
          const calculateVol = bidItem.qty / volumeCalculate;
          self.redisClient.hset(RedisBidHashTable,bidItem.price,calculateVol);
        });

      }
      else {
        // only if orderbook diff is exist, save to redis.
        if(parseOrderbook[1].DIFF.ASK.length > 0) {
          self.redisClient.del(RedisAskHashTable);

          ask_price.forEach(askItem => {
            const calculateVol = askItem.qty / volumeCalculate;
            self.redisClient.hset(RedisAskHashTable,askItem.price,calculateVol);
          });
        }

        if(parseOrderbook[1].DIFF.BID.length > 0) {
          self.redisClient.del(RedisBidHashTable);

          bid_price.forEach(bidItem => {
            const calculateVol = bidItem.qty / volumeCalculate;
            self.redisClient.hset(RedisBidHashTable,bidItem.price,calculateVol);
          });
        }
      }
    }

  });

}

/**
* @description Coinone Websocket Status Check
* @param 
*/

CoinoneWS.prototype.checkHeartBeat = function() {

  const self     = this;
  const wsclient = new wsClient(this.WebsocketURL, coinoneConfig.connection_option);

  const RedisHeartBeatTable = `${this.Market}_HEARTBEAT`;

  // websocket client start.
  wsclient.start();

  wsclient.on("connect", function(connection){
    console.log(`${self.Market} Websocket Client Connected, HeartBeat Check`);
    self.redisClient.set(RedisHeartBeatTable, true);

  });
  
  wsclient.on("reconnect",function(){
    console.log(`${self.Market} Websocket Reconnecting...`);
    self.redisClient.set(RedisHeartBeatTable, false);

  });

}


/**  
  * @typedef _getDataType  
  * @param  웹소켓에서 받은 data를 type 별로 구분. 
  * @description 
  * @returns 
  *   40 : response from server 
  *   42 : orderbook
*/ 

function _getDataType (data) {
  let split_data = data.split(',')[0].split('/');
  return split_data[0]
}

module.exports = CoinoneWS;



