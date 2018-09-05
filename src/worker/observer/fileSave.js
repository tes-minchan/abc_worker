const fs = require('fs');
const _  = require('lodash');
const marketConfig = require('config').marketConfig;
const util = require('lib/util');

// file save env.

const saveInterval = 0.4;  // minutes
const savePath     = './files';

function fileSave (type) {
  console.log(type, " start");
  this.startDate = new Date().getTime();

  const timestamp = new Date(this.startDate);
  this.fileName = {};

  if(type === 'allPrice') {
    this.fileHeader = "time, ask, askVolume, bid, bidVolume, market \n";

    // init file save directory.
    marketConfig.marketListKorea.forEach(market => {
      marketConfig[market].crawl_list.forEach(coin => {
        
        if (!fs.existsSync(`${savePath}/${coin}`)) {
          fs.mkdirSync(`${savePath}/${coin}`);
        }


        this.fileName[coin] = `${timestamp.toISOString()}_${coin}_allPrice.csv`;
        fs.writeFile(`${savePath}/${coin}/${this.fileName[coin] }`, this.fileHeader, function(err) {
          if(err) {
            console.log(err);
            throw err;
          }
        });

      });

    });
  }
  else if(type === 'arbInfo') {
    this.fileHeader = "time, minAskPrice, minAskVol, minAskMarket, maxBidPrice, maxBidVol, maxBidMarket, minimumVolume, requiredFunds, profit, profitPercentage \n";
    
    // init file save directory.
    marketConfig.marketListKorea.forEach(market => {
      marketConfig[market].crawl_list.forEach(coin => {
        
        if (!fs.existsSync(`${savePath}/${coin}`)){
          fs.mkdirSync(`${savePath}/${coin}`);
        }

        this.fileName[coin] = `${timestamp.toISOString()}_${coin}_arbInfo.csv`;
        fs.writeFile(`${savePath}/${coin}/${this.fileName[coin] }`, this.fileHeader, function(err) {
          if(err) {
            console.log(err);
            throw err;
          }
        });

      });

    });
  }

}


fileSave.prototype.fileUpdateAllPrice = function(coinInfo, redis_table) {
  return new Promise((resolve)=> {
    let saveData  = {
      ask : undefined,
      askVol : undefined,
      bid : undefined,
      bidVol : undefined,
      currency : undefined,
      market : undefined
    }
  
    const currTime = new Date();
    const checkTime = (currTime - this.startDate) / 60000;
  
    let saveNewFile = false;
  
    if(checkTime > saveInterval) {
      this.startDate = new Date().getTime();
      saveNewFile = true;
    }
  
    for(const [index, item] of coinInfo.entries()) {
      if(!item) {
        continue;
      }
      else {
        if(index%2 !== 0) {
          const getIndex = Object.keys(item).length - 1;
  
          saveData.bid = Object.keys(item)[getIndex];
          saveData.bidVol = Object.values(item)[getIndex];
  
          saveData.market = redis_table[index][1].split('_')[0];
          saveData.currency = redis_table[index][1].split('_')[1].replace('KRW','');
  
          const dataToFile = `${currTime.toISOString()}, ${saveData.ask}, ${saveData.askVol}, ${saveData.bid}, ${saveData.bidVol}, ${saveData.market}` + "\n";

          if(!saveNewFile) {
            fs.appendFile(`${savePath}/${saveData.currency}/${this.fileName[saveData.currency]}`, dataToFile, function(err) {
              if(err) throw err;
            });
          }
          else {
            const timestamp = new Date(this.startDate);
            this.fileName[saveData.currency] = `${timestamp.toISOString()}_${saveData.currency}.csv`;
  
            fs.writeFile(`${savePath}/${saveData.currency}/${this.fileName[saveData.currency] }`, this.fileHeader + dataToFile, function(err) {
              if(err) throw err;
            });
          }
        }
        else {
          saveData.ask    = Object.keys(item)[0];
          saveData.askVol = Object.values(item)[0];
        }
      }
    }
    resolve();
  });

}

fileSave.prototype.fileUpdateArbInfo = function(coinInfo, redis_table) {

  return new Promise((resolve)=> {
    let saveDataArr = {};

    const currTime = new Date();
    const checkTime = (currTime - this.startDate) / 60000;
  
    let saveNewFile = false;
  
    if(checkTime > saveInterval) {
      this.startDate = new Date().getTime();
      saveNewFile = true;
    }

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

      let dataToFile  = `${currTime.toISOString()}, ${saveDataArr[coinName].minAskPrice}, ${saveDataArr[coinName].minAskVolume}, ${saveDataArr[coinName].minAskMarket},`;
          dataToFile += `${saveDataArr[coinName].maxBidPrice}, ${saveDataArr[coinName].maxBidVolume}, ${saveDataArr[coinName].maxBidMarket}, ${saveDataArr[coinName].minimumVolume},`;
          dataToFile += `${saveDataArr[coinName].requiredFunds}, ${saveDataArr[coinName].profit}, ${saveDataArr[coinName].profitPercentage}` + "\n";

      if(!saveNewFile) {
        fs.appendFile(`${savePath}/${coinName}/${this.fileName[coinName]}`, dataToFile, function(err) {
          if(err) throw err;
        });
      }
      else {
        const timestamp = new Date(this.startDate);
        this.fileName[coinName] = `${timestamp.toISOString()}_${coinName}_arbInfo.csv`;

        fs.writeFile(`${savePath}/${coinName}/${this.fileName[coinName] }`, this.fileHeader + dataToFile, function(err) {
          if(err) throw err;
        });
      }


    });


    resolve();
  });

}



module.exports = fileSave;