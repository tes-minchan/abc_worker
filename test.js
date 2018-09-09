const redis    = require('redis');
const config = require('./src/config');
const _ = require('lodash');

const redisClient  = redis.createClient(config.redisQuotes);
const market = "BITFINEX";
const coin   = "ETHBTC";

function main() {
  console.log(`=========${market}-${coin}=========`);
  redisClient.hgetall(`${market}_${coin}_ASK`, function (err, obj) {
    const askArr = _.map(obj, (volume, price) => {
      return {
        price : Number(price),
        volume : volume
      };
    });
    console.log(askArr);
    const askSorted = _.sortBy(askArr, ['price', 'volume']);

    // console.log('ASK',askSorted[0]); // first
    // console.log('ASK',askSorted[1]);

  });

  redisClient.hgetall(`${market}_${coin}_BID`, function (err, obj) {
    const askArr = _.map(obj, (volume, price) => {
      return {
        price : Number(price),
        volume : volume
      };
    });
    const askSorted = _.sortBy(askArr, ['price', 'volume']);
    askSorted.reverse();

    // console.log('BID',askSorted[0]); // first
    // console.log('BID',askSorted[1]);

  });

}


main();

// setInterval(main, 100);
