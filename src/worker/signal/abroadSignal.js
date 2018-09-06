const _  = require('lodash');
const util = require('lib/util');
const schema = require('lib/shema');
const redisClient = require('lib/redis');

function abroadSignal (redisAbroadTable) {
  this.redisTable = redisAbroadTable;
}

abroadSignal.prototype.getArbSignal = function () {
  return new Promise(async (resolve)=> {

    redisClient.getMultiTable(this.redisTable)
    .then(async (res) => {

      resolve(await getArbInfo(res, this.redisTable))  
    });
  });
}


const getArbInfo = function(coinInfo, redis_table) {

  return new Promise(async (resolve)=> {
    let saveDataArr = {};

    for(const [index, item] of coinInfo.entries()) {
      if(!item) {
        continue;
      }
      else {
        const currency = redis_table[index][1].split('_')[1];
        const type     = redis_table[index][1].split('_')[2];

        if(type === 'ASK') {
          const askData = await util.parseAskData(item);

          if(!saveDataArr[currency]) {
            saveDataArr[currency] = {};
            saveDataArr[currency].minAskPrice  = askData.price;
            saveDataArr[currency].minAskVolume = askData.volume;
            saveDataArr[currency].minAskMarket = redis_table[index][1].split('_')[0];
          }
          else {
            if(Number(askData.price) < Number(saveDataArr[currency].minAskPrice)) {
              saveDataArr[currency].minAskPrice  = askData.price;
              saveDataArr[currency].minAskVolume = askData.volume;
              saveDataArr[currency].minAskMarket = redis_table[index][1].split('_')[0];
            }
          }

        }
        else if(type === 'BID') {
          const bidData = await util.parseBidData(item);

          if(!saveDataArr[currency].maxBidPrice) {
            saveDataArr[currency].maxBidPrice  = bidData.price;
            saveDataArr[currency].maxBidVolume = bidData.volume;
            saveDataArr[currency].maxBidMarket = redis_table[index][1].split('_')[0];
          }
          else {
            if(Number(bidData.price) > Number(saveDataArr[currency].maxBidPrice)) {
              saveDataArr[currency].maxBidPrice  = bidData.price;
              saveDataArr[currency].maxBidVolume = bidData.volume;
              saveDataArr[currency].maxBidMarket = redis_table[index][1].split('_')[0];
            }
          }
        }
      }
    }

    _.forEach(saveDataArr, (element, coinName) => {

      saveDataArr[coinName].minimumVolume = Number(element.minAskVolume) > Number(element.maxBidVolume) ? element.maxBidVolume : element.minAskVolume;
      saveDataArr[coinName].requiredFunds = Number(element.minAskPrice) * Number(saveDataArr[coinName].minimumVolume);
      saveDataArr[coinName].profit        = Number(saveDataArr[coinName].minimumVolume) * ( Number(element.maxBidPrice) - Number(element.minAskPrice) );
      if(Number(saveDataArr[coinName].profit) !== 0 && Number(saveDataArr[coinName].minimumVolume) !== 0) {
        saveDataArr[coinName].profitPercentage = ( Number(saveDataArr[coinName].profit) / Number(saveDataArr[coinName].requiredFunds) ) * 100;
        saveDataArr[coinName].profitPercentage = util.convertFloatDigit(saveDataArr[coinName].profitPercentage,2);
      }
      else {
        saveDataArr[coinName].profitPercentage = 0;
      }

      // validate save string.
      // const validate = schema.arbInfoShema({
      //   minAskPrice  : saveDataArr[coinName].minAskPrice,
      //   minAskVolume : saveDataArr[coinName].minAskVolume,
      //   minAskMarket : saveDataArr[coinName].minAskMarket,
      //   maxBidPrice : saveDataArr[coinName].maxBidPrice,
      //   maxBidVolume : saveDataArr[coinName].maxBidVolume,
      //   maxBidMarket : saveDataArr[coinName].maxBidMarket,
      //   minimumVolume : saveDataArr[coinName].minimumVolume,
      //   requiredFunds : saveDataArr[coinName].requiredFunds,
      //   profit : saveDataArr[coinName].profit,
      //   profitPercentage : saveDataArr[coinName].profitPercentage,
      // });

    });
    resolve(saveDataArr);

  });

}

module.exports = abroadSignal;
