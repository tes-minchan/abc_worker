const _  = require('lodash');
const util = require('lib/util');
const schema = require('lib/shema');
const redisClient = require('lib/redis');
const config = require('./config');
const slackBot = require('worker/slackBot');

function koreaSignal (getRedisTable) {
  this.redisTable = getRedisTable;
  this.redisConnection = redisClient.getQuotesConn();

  this.SlackBot   = new slackBot();
}

koreaSignal.prototype.getArbSignal = function () {
  return new Promise(async (resolve)=> {

    redisClient.getMultiTable(this.redisConnection, this.redisTable)
    .then(async (res) => {

      resolve(await getArbInfo(res, this.redisTable))  
    });
  });
}

koreaSignal.prototype.sendSlack = function(data) {

  _.forEach(data, (element, coin) => {
    // validate save string.
    schema.arbInfoShema({
      minAskPrice   : element.minAskPrice,
      minAskVolume  : element.minAskVolume,
      minAskMarket  : element.minAskMarket,
      maxBidPrice   : element.maxBidPrice,
      maxBidVolume  : element.maxBidVolume,
      maxBidMarket  : element.maxBidMarket,
      minimumVolume : element.minimumVolume,
      requiredFunds : element.requiredFunds,
      profit : element.profit,
      profitPercentage : element.profitPercentage,
    })
      .then((res) => {
        if(element.profitPercentage > 1) {
          if(parseInt(element.profitPercentage) !== config.koreaSignalSubs[coin].sendedPercentage) {

            if(parseInt(element.profitPercentage) > config.koreaSignalSubs[coin].sendedPercentage) {
              const toSendData = {
                coin : coin,
                data : element
              }
              this.SlackBot.sendMessage(toSendData);
              config.koreaSignalSubs[coin].sendedPercentage = parseInt(element.profitPercentage);
            }
            else {
              config.koreaSignalSubs[coin].sendedPercentage = parseInt(element.profitPercentage); 
            }
          }
        }
      })
      .catch(err => {

      });
  })


}

const getArbInfo = function(coinInfo, redis_table) {

  return new Promise(async (resolve)=> {
    let saveDataArr = {};

    for(const [index, item] of coinInfo.entries()) {
      if(!item) {
        continue;
      }
      else {
        const currency = redis_table[index][1].split('_')[1].replace('KRW','');
        const type     = redis_table[index][1].split('_')[2];

        if(type === 'ASK') {
          if(!saveDataArr[currency]) {
            saveDataArr[currency] = {};
            saveDataArr[currency].minAskPrice  = Object.keys(item)[0];
            saveDataArr[currency].minAskVolume = Object.values(item)[0];
            saveDataArr[currency].minAskMarket = redis_table[index][1].split('_')[0];
          }
          else {
            if(Number(Object.keys(item)[0]) < Number(saveDataArr[currency].minAskPrice)) {
              saveDataArr[currency].minAskPrice  = Object.keys(item)[0];
              saveDataArr[currency].minAskVolume = Object.values(item)[0];
              saveDataArr[currency].minAskMarket = redis_table[index][1].split('_')[0];
            }
          }

        }
        else if(type === 'BID') {
          const getIndex = Object.keys(item).length - 1;

          if(!saveDataArr[currency].maxBidPrice) {
            saveDataArr[currency].maxBidPrice  = Object.keys(item)[getIndex];
            saveDataArr[currency].maxBidVolume = Object.values(item)[getIndex];
            saveDataArr[currency].maxBidMarket = redis_table[index][1].split('_')[0];
          }
          else {
            if(Number(Object.keys(item)[getIndex]) > Number(saveDataArr[currency].maxBidPrice)) {
              saveDataArr[currency].maxBidPrice  = Object.keys(item)[getIndex];
              saveDataArr[currency].maxBidVolume = Object.values(item)[getIndex];
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

    });

    resolve(saveDataArr);
  });

}

module.exports = koreaSignal;
