const fs = require('fs');
const _  = require('lodash');
const marketConfig = require('config').marketConfig;
const util = require('lib/util');
const schema = require('lib/shema');

// file save env.

const saveInterval = 240;  // minutes
const savePath     = '/root/data/files/abroad';

function fileSave (type) {
  console.log(type, " start");
  this.startDate = new Date().getTime();

  const timestamp = new Date(this.startDate);
  const fileString = timestamp.toISOString().split('T');

  this.fileName = {};

  if(type === 'allPrice') {
    this.fileHeader = "time, ask, askVolume, bid, bidVolume, market \n";

    // init file save directory.
    marketConfig.marketListAbroad.forEach(market => {
      marketConfig[market].crawl_list.forEach(coin => {
        if (!fs.existsSync(`${savePath}/${coin}`)) {
          fs.mkdirSync(`${savePath}/${coin}`);
        }

        this.fileName[coin] = `${fileString[0]}T${fileString[1].split(':')[0]}_${coin}_allPrice.csv`;
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
    marketConfig.marketListAbroad.forEach(market => {
      marketConfig[market].crawl_list.forEach(coin => {
        
        if (!fs.existsSync(`${savePath}/${coin}`)){
          fs.mkdirSync(`${savePath}/${coin}`);
        }

        this.fileName[coin] = `${fileString[0]}T${fileString[1].split(':')[0]}_${coin}_arbInfo.csv`;
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
  return new Promise(async (resolve)=> {

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
          const bidData = await util.parseBidData(item);

          saveData.market   = redis_table[index][1].split('_')[0];
          saveData.currency = redis_table[index][1].split('_')[1];
          saveData.bid    = bidData.price;
          saveData.bidVol = bidData.volume;
  
          const dataToFile = `${currTime.toISOString()}, ${saveData.ask}, ${saveData.askVol}, ${saveData.bid}, ${saveData.bidVol}, ${saveData.market}` + "\n";

          // validate save string.
          const validate = await schema.allPricesShema({
            ask : saveData.ask,
            askVol : saveData.askVol,
            bid : saveData.bid,
            bidVol : saveData.bidVol,
            market : saveData.market
          });
          if(validate) {
            if(!saveNewFile) {
              fs.appendFile(`${savePath}/${saveData.currency}/${this.fileName[saveData.currency]}`, dataToFile, function(err) {
                if(err) throw err;
              });
            }
            else {
              const timestamp = new Date(this.startDate);
              this.fileName[saveData.currency] = `${timestamp.toISOString()}_${saveData.currency}_allPrice.csv`;
    
              fs.writeFile(`${savePath}/${saveData.currency}/${this.fileName[saveData.currency] }`, this.fileHeader + dataToFile, function(err) {
                if(err) throw err;
              });
            }
          }
          else {
            console.log("[Abroad] AllPrice Schema validate Error. Skip save to file");
            console.log(saveData);
          }

        }
        else {
          const askData = await util.parseAskData(item);
          saveData.ask    = askData.price;
          saveData.askVol = askData.volume;
        }
      }
    }
    resolve();
  });

}



fileSave.prototype.fileUpdateArbInfo = function(coinInfo, redis_table) {

  return new Promise(async (resolve)=> {
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

      let dataToFile  = `${currTime.toISOString()}, ${saveDataArr[coinName].minAskPrice}, ${saveDataArr[coinName].minAskVolume}, ${saveDataArr[coinName].minAskMarket},`;
          dataToFile += `${saveDataArr[coinName].maxBidPrice}, ${saveDataArr[coinName].maxBidVolume}, ${saveDataArr[coinName].maxBidMarket}, ${saveDataArr[coinName].minimumVolume},`;
          dataToFile += `${saveDataArr[coinName].requiredFunds}, ${saveDataArr[coinName].profit}, ${saveDataArr[coinName].profitPercentage}` + "\n";

      // validate save string.
      const validate = schema.arbInfoShema({
        minAskPrice  : saveDataArr[coinName].minAskPrice,
        minAskVolume : saveDataArr[coinName].minAskVolume,
        minAskMarket : saveDataArr[coinName].minAskMarket,
        maxBidPrice : saveDataArr[coinName].maxBidPrice,
        maxBidVolume : saveDataArr[coinName].maxBidVolume,
        maxBidMarket : saveDataArr[coinName].maxBidMarket,
        minimumVolume : saveDataArr[coinName].minimumVolume,
        requiredFunds : saveDataArr[coinName].requiredFunds,
        profit : saveDataArr[coinName].profit,
        profitPercentage : saveDataArr[coinName].profitPercentage,
      });

      if(validate) {
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
      }
      else {
        console.log("ArbInfo Schema validate Error. Skip save to file");
        console.log(saveDataArr[coinName]);
      }
    });

    resolve();
  });

}

module.exports = fileSave;

