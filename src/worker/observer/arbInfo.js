const redisClient    = require('lib/redis');
const redisConnection = redisClient.getQuotesConn();

const observer = (fileSaver, redisTable) => {

  let enableSave = true;
  redisClient.getMultiTable(redisConnection, redisTable)
  .then(async (res) => {
    if(enableSave) {
      enableSave = false;
      
      await fileSaver.fileUpdateArbInfo(res, redisTable);  
      enableSave = true;

    }

  });
}

module.exports = observer;














