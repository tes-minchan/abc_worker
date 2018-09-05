const redis    = require('redis');
const config = require('./src/config');
const _ = require('lodash');

const redisClient  = redis.createClient(config.redisConfig);

let index = 0;
let price = 0;
let volume = 0;

function main() {

  redisClient.hgetall("BINANCE_EOSBTC_ASK", function (err, obj) {
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

  redisClient.hgetall("BINANCE_EOSBTC_BID", function (err, obj) {
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
