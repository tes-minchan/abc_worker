const redis    = require('redis');
const config = require('./src/config');
const _ = require('lodash');
const sleep = require('sleep');

const redisClient  = redis.createClient(config.redisConfig);

let index = 0;
let price = 0;
let volume = 0;

function main() {
  console.log("====================");
  redisClient.hgetall("HUOBI_BATETH_ASK", function (err, obj) {
    // console.log(typeof obj);
    console.time("ASK");

    const askArr = _.map(obj, (volume, price) => {
      return {
        price : price,
        volume : volume
      };
    });
    const askSorted = _.sortBy(askArr, ['price', 'volume']);
    console.timeEnd("ASK");

    console.log(askSorted[0]); // first
    console.log(askSorted[1]);

  });

  redisClient.hgetall("HUOBI_BATETH_BID", function (err, obj) {
    console.time("BID");
    const askArr = _.map(obj, (volume, price) => {
      return {
        price : price,
        volume : volume
      };
    });
    const askSorted = _.sortBy(askArr, ['price', 'volume']);
    askSorted.reverse();
    console.timeEnd("BID");

    console.log(askSorted[0]); // first
    console.log(askSorted[1]);

  });

}



setInterval(main, 100);
