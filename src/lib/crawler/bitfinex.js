/*
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
 *                               BITFINEX WEBSOCKET API
 *   GENERAL DESCRIPTION
 *     Get quotes from websocket.
 *     currencyList 변수에 코인 통화쌍을 추가하면 해당 통화를 subscribe하고 가격을 받아옴. 
 * 
 *   REFERENCE WEBSITE
 *     https://docs.bitfinex.com/docs
 * 
 *   SUPPORTED CURRENCY
 *   Supported Pairs
 *     BTCUSD LTCUSD LTCBTC ETHUSD ETHBTC ETCBTC ETCUSD RRTUSD RRTBTC ZECUSD ZECBTC XMRUSD XMRBTC DSHUSD DSHBTC 
 *     BTCEUR XRPUSD XRPBTC IOTUSD IOTBTC IOTETH EOSUSD EOSBTC EOSETH SANUSD SANBTC SANETH OMGUSD OMGBTC OMGETH 
 *     BCHUSD BCHBTC BCHETH NEOUSD NEOBTC NEOETH ETPUSD ETPBTC ETPETH QTMUSD QTMBTC QTMETH AVTUSD AVTBTC AVTETH 
 *     EDOUSD EDOBTC EDOETH BTGUSD BTGBTC DATUSD DATBTC DATETH QSHUSD QSHBTC QSHETH YYWUSD YYWBTC YYWETH GNTUSD 
 *     GNTBTC GNTETH SNTUSD SNTBTC SNTETH IOTEUR BATUSD BATBTC BATETH MNAUSD MNABTC MNAETH FUNUSD FUNBTC FUNETH 
 *     ZRXUSD ZRXBTC ZRXETH TNBUSD TNBBTC TNBETH SPKUSD SPKBTC SPKETH TRXUSD TRXBTC TRXETH RCNUSD RCNBTC RCNETH 
 *     RLCUSD RLCBTC RLCETH AIDUSD AIDBTC AIDETH SNGUSD SNGBTC SNGETH REPUSD REPBTC REPETH ELFUSD ELFBTC ELFETH
 *   
 *   CREATED DATE, 2018.08.01
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
*/

const sleep = require('sleep');
const redis = require('redis');
const wsClient = require('ws-reconnect');

const config = require('config');
const bitfinexConfig = config.marketConfig.bitfinex;
const heartBeatInterval = 60000;

function BitfinexWS () {

  this.Market        = "BITFINEX";
  this.WebsocketURL  = "wss://api.bitfinex.com/ws/2";
  this.redisClient   = redis.createClient(config.redisConfig);
  this.RedisHeartBeatTable = `${this.Market}_HEARTBEAT`;
  this.heartBeatTimestamp  = new Date().getTime();
}

BitfinexWS.prototype.getQuotes = function() {

  const self        = this;
  const wsclient    = new wsClient(this.WebsocketURL, bitfinexConfig.connection_option);
  let subscribeInfo = {};

  // websocket heartBeat func.
  const heartBeat = (ws) => {
    const curr = new Date().getTime();

    if(heartBeatInterval < (curr - this.heartBeatTimestamp)) {
      self.redisClient.set(this.RedisHeartBeatTable, false);
    }
    else {
      self.redisClient.set(this.RedisHeartBeatTable, true);
    }

    const heartBeat = JSON.stringify({
      event : 'ping'
    });

    ws.socket.send(heartBeat);
  }

  // websocket client start.
  wsclient.start();

  wsclient.on("connect", function(connection){
    console.log(`${self.Market} Websocket Client Connected`);

    bitfinexConfig.crawl_list.forEach(coin => {
      const subscribe = JSON.stringify({ 
        event: 'subscribe', 
        channel: 'book', 
        symbol: `t${coin}`,
        
      })

      wsclient.socket.send(subscribe);
      sleep.msleep(100);
    });

    setInterval(heartBeat, heartBeatInterval, wsclient);
  });

  wsclient.on("message",(data) => {
    var parseJson = JSON.parse(data.toString());

    if(parseJson.event === 'info' || parseJson[1] === 'hb' || parseJson.event === 'pong') {
      if(parseJson.event === 'pong') {
        this.heartBeatTimestamp = parseJson.ts;
      }
      return;
    }
    else if(parseJson.event === 'subscribed') {
      subscribeInfo[parseJson.chanId] = parseJson;
    }
    else {

      // orderbook.
      const coinId = parseJson[0];
      const orderbook = parseJson[1];

      const REDIS_ASK_HNAME = `${self.Market}_${subscribeInfo[coinId].pair}_ASK`;
      const REDIS_BID_HNAME = `${self.Market}_${subscribeInfo[coinId].pair}_BID`;

      if(orderbook.length === 50) {

        self.redisClient.del(REDIS_ASK_HNAME);
        self.redisClient.del(REDIS_BID_HNAME);
      
        orderbook.map(item => {
          if(item[2] > 0) {
            self.redisClient.hset(REDIS_BID_HNAME,item[0],item[2]);
          }
          else {
            self.redisClient.hset(REDIS_ASK_HNAME,item[0],Math.abs(item[2]));
          }
        });

      }
      else {
        const [price,count,amount] = [orderbook[0], orderbook[1], orderbook[2]];

        // when count > 0 then you have to add or update the price level
        if(count > 0) {
          /*
          *  if amount > 0 then add/update bids
          *  if amount < 0 then add/update asks
          */
          if(amount > 0) {
            self.redisClient.hget(REDIS_BID_HNAME,price,(err, result) => {
              if(result) {
                self.redisClient.hset(REDIS_BID_HNAME,price,amount);
              }
              else {
                self.redisClient.hset(REDIS_BID_HNAME,price,amount);

              }
            });
          }
          else {
            self.redisClient.hget(REDIS_ASK_HNAME,price,(err, result) => {
              if(result) {
                self.redisClient.hset(REDIS_ASK_HNAME,price,Math.abs(amount));
              }
              else {
                self.redisClient.hset(REDIS_ASK_HNAME,price,Math.abs(amount));
              }
            });
          }
        }
        // when count = 0 then you have to delete the price level.
        else {
          /*
          *  if amount = 1 then remove from bids
          *  if amount = -1 then remove from asks
          */
          if(amount == 1) {
            self.redisClient.hdel(REDIS_BID_HNAME, price);
          }
          else {
            self.redisClient.hdel(REDIS_ASK_HNAME, price);
          }
        }
      }

    }

  });

}


module.exports = BitfinexWS
