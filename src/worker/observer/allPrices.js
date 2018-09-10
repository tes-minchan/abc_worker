const redisClient = require('lib/redis');
const redisConnection = redisClient.getQuotesConn();

const observer = function (fileSaver, redisTable) {

  let enableSave = true;
  redisClient.getMultiTable(redisConnection, redisTable)
  .then(async (res) => {
    if(enableSave) {
      enableSave = false;

      await fileSaver.fileUpdateAllPrice(res, redisTable);  
      enableSave = true;

    }

  });
}



module.exports = observer;















