const redis = require('redis');
const config = require('config');
const _ = require('lodash');
const redisController = require('lib/redis');
const makeRedisTable = require('lib/worker/makeRedisTable');


function koreaAggregator() {

  console.log(`Start koreaAggregator !!!`);

}

koreaAggregator.prototype.makeAggregateBook = function () {

  _getRedisTable()
    .then(async (res) => {
      const allOrderbook = await redisController.getMultiTable(res);
      const delOrderbook = [];


      allOrderbook.forEach((element, index) => {
        const market = res[index][1].split('_')[0];
        const coin = res[index][1].split('_')[1];
        const type = res[index][1].split('_')[2];

        if (type === 'ASK') {
          const redisTableName = `Aggregate_${coin}_${type}`;

          if (!delOrderbook.includes(redisTableName)) {
            redisController.delTable(redisTableName, 1);
            delOrderbook.push(redisTableName);
          }

          _.forEach(element, (volume, price) => {
            const description = `${market}_${volume}`;
            redisController.setSortedTable(redisTableName, price, description);
          });

        }
        else if (type === 'BID') {
          const redisTableName = `Aggregate_${coin}_${type}`;

          if (!delOrderbook.includes(redisTableName)) {
            redisController.delTable(redisTableName, 1);
            delOrderbook.push(redisTableName);
          }

          _.forEach(element, (volume, price) => {
            const description = `${market}_${volume}`;
            redisController.setSortedTable(redisTableName, price, description);
          });
        }
      });


    });

}

async function _getRedisTable() {
  return new Promise(async (resolve) => {
    await makeRedisTable.getKoreaCoinTable()
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        console.log(err);
      })
  });
}


module.exports = koreaAggregator;