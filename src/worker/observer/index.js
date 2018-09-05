const sleep = require('sleep');

const fileSave       = require('./fileSave');
const makeRedisTable = require('lib/worker/makeRedisTable');

const allPricesDaemon = require('./allPrices');
const arbInfoDaemon   = require('./arbInfo');


async function main() {
  const redisTable = await makeRedisTable.getCoinTable();
  const allPriceSaver = new fileSave('allPrice');
  setInterval(allPricesDaemon, 1000, allPriceSaver, redisTable);

  sleep.sleep(1);
  const arbInfoSaver  = new fileSave('arbInfo');
  setInterval(arbInfoDaemon, 1000, arbInfoSaver, redisTable);


}

main();
