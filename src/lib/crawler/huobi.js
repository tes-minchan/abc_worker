/*
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
 *                               UPBIT WEBSOCKET API
 *   GENERAL DESCRIPTION
 *     Get quotes from websocket.
 *     
 * 
 *   REFERENCE WEBSITE
 *     https://github.com/huobiapi/API_Docs_en/wiki/WS_Reference
 * 
 *   SUPPORTED CURRENCY
 *     refer to : https://api.huobi.pro/v1/common/symbols
 *     
 *   EXAMPLE CODE GET SUPPORTED CURENCY 
 *     axios.get('https://api.huobi.pro/v1/common/symbols')
 *       .then(response => {
 *         response.data.data.forEach(element => {
 *           console.log(`${element['base-currency']}${element['quote-currency']}`);
 *         })
 *       })
 * 
 *   CREATED DATE, 2018.09.04
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
*/

const redis = require('redis');
const wsClient = require('ws-reconnect');
const pako = require('pako');

const config = require('config');
const huobiConfig = config.marketConfig.huobi;
const heartBeatInterval = 60000;

function HuobiWS () {

  this.Market       = "HUOBI";
  this.WebsocketURL = "wss://api.huobi.pro/ws";
  this.redisClient  = redis.createClient(config.redisConfig);
  this.RedisHeartBeatTable = `${this.Market}_HEARTBEAT`;
  this.heartBeatTimestamp  = new Date().getTime();
}

HuobiWS.prototype.getQuotes = function() {
  const self     = this;
  const wsclient = new wsClient(this.WebsocketURL, huobiConfig.connection_option);

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

    huobiConfig.crawl_list.forEach(coin => {
      const subscribe = JSON.stringify({
        sub : `market.${coin.toLowerCase()}.depth.step3`,
        id  : "faoiewjfoiawhgiuehuf"
      });

      wsclient.socket.send(subscribe);
    });

    setInterval(heartBeat, heartBeatInterval, wsclient);

  });

  wsclient.on("message",(data) => {
    let parseJson = JSON.parse(pako.inflate(data, { to: 'string' }));
    if(parseJson.ping) {
      this.heartBeatTimestamp = parseJson.ping;
      wsclient.socket.send(JSON.stringify({
        pong: parseJson.ping
      }));
    }
    else if(parseJson.tick) {
      const currency = parseJson.ch.split('.')[1];

      const RedisAskHashTable = `${self.Market}_${currency.toUpperCase()}_ASK`;
      const RedisBidHashTable = `${self.Market}_${currency.toUpperCase()}_BID`;

      self.redisClient.del(RedisAskHashTable);
      parseJson.tick.asks.forEach(element => {
        self.redisClient.hset(RedisAskHashTable,element[0],element[1]);
      });

      self.redisClient.del(RedisBidHashTable);
      parseJson.tick.bids.forEach(element => {
        self.redisClient.hset(RedisBidHashTable,element[0],element[1]);
      });
      
    }

  });

}

module.exports = HuobiWS;