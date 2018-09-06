const koreaSignal = require('./koreaSignal');
const makeRedisTable = require('lib/worker/makeRedisTable');
const config = require('./config');

const signal = function(koreaSignalController) {
  koreaSignalController.getArbSignal()
    .then(res => {
      koreaSignalController.sendSlack(res);
    })
}


async function main () {    
  const redisKoreaTable = await makeRedisTable.getKoreaCoinTable(config.koreaSignalSubs);
  const KoreaSignal = new koreaSignal(redisKoreaTable);

  setInterval(signal, config.signalConfig.signalInterval, KoreaSignal);

}


main();
