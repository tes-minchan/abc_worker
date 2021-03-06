const sleep = require('sleep');
const fs    = require('fs');

const { koreaCoin, abroadCoin } = require('./fileSave');
const makeRedisTable = require('lib/worker/makeRedisTable');

const allPrices = require('./allPrices');
const arbInfo   = require('./arbInfo');


async function main() {

  if (!fs.existsSync(`/root/data/files`)) {
    fs.mkdirSync(`/root/data/files`);
  }

  if (!fs.existsSync(`/root/data/files/korea`)) {
    fs.mkdirSync(`/root/data/files/korea`);
  }

  if (!fs.existsSync(`/root/data/files/abroad`)) {
    fs.mkdirSync(`/root/data/files/abroad`);
  }

  const redisKoreaTable = await makeRedisTable.getKoreaCoinTable();
  const allPriceKorea = new koreaCoin('allPrice');
  setInterval(allPrices, 1000, allPriceKorea, redisKoreaTable);

  sleep.sleep(1);
  const arbInfoKorea  = new koreaCoin('arbInfo');
  setInterval(arbInfo, 1000, arbInfoKorea, redisKoreaTable);

  
  const redisAbroadTable = await makeRedisTable.getAbroadCoinTable();
  const allPriceAbroad = new abroadCoin('allPrice');
  setInterval(allPrices, 1000, allPriceAbroad, redisAbroadTable);

  sleep.sleep(1);
  const arbInfoAbroad  = new abroadCoin('arbInfo');
  setInterval(arbInfo, 1000, arbInfoAbroad, redisAbroadTable);
}

main();
