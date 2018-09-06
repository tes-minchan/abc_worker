const Joi = require('joi');

module.exports = {

  allPricesShema : (obj) => {
    return new Promise((resolve, reject)=> {
      const schema = Joi.object().keys({
        ask : Joi.required(),
        askVol : Joi.required(),
        bid : Joi.required(),
        bidVol : Joi.required(),
        market : Joi.required(),
      });

      const validateKey = Joi.validate(obj, schema);

      if(validateKey.error) {
        console.log(validateKey.error);
        reject(false);
      }
      else {
        resolve(true);
      }

    });
  },

  arbInfoShema : (obj) => {
    return new Promise((resolve, reject)=> {
      const schema = Joi.object().keys({
        minAskPrice      : Joi.required(),
        minAskVolume     : Joi.required(),
        minAskMarket     : Joi.required(),
        maxBidPrice      : Joi.required(),
        maxBidVolume     : Joi.required(),
        maxBidMarket     : Joi.required(),
        minimumVolume    : Joi.required(),
        requiredFunds    : Joi.required(),
        profit           : Joi.required(),
        profitPercentage : Joi.required(),
      });

      const validateKey = Joi.validate(obj, schema);

      if(validateKey.error) {
        console.log(validateKey.error);
        reject(false);
      }
      else {
        resolve(true);
      }

    });
  }


}