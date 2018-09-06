const _ = require('lodash');


module.exports = {
  convertFloatDigit : (number,digit) =>{
    return Math.floor(number * Math.pow(10,digit)) / Math.pow(10,digit);
  },

  parseBidData : function(object) {
    return new Promise((resolve)=> {
      const bidArr = _.map(object, (volume, price) => {
        return {
          price : Number(price),
          volume : volume
        };
      });
      const bidSorted = _.sortBy(bidArr, ['price', 'volume']);
      bidSorted.reverse();
      resolve(bidSorted[0]);

    });
  },

  parseAskData : function(object) {
    return new Promise((resolve)=> {
      const askArr = _.map(object, (volume, price) => {
        return {
          price : Number(price),
          volume : volume
        };
      });
      const askSorted = _.sortBy(askArr, ['price', 'volume']);
      resolve(askSorted[0]);

    });
  }
}