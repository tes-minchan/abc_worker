const Joi = require('joi');

const obj = { ask: '1667',
askVol: '2212.215',
bid: '1641',
bidVol: '8.5997',
market: 'BITHUMB' }

const schema = Joi.object().keys({
  ask : Joi.required(),
  askVol : Joi.required(),
  bid : Joi.required(),
  bidVol : Joi.required(),
  market : Joi.required(),
});

const validateKey = Joi.validate(obj, schema);

if(validateKey.error) {
  console.log(1, validateKey.error);
}
else {
  console.log(2, validateKey);

}


