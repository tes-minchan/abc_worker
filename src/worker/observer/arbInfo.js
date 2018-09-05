const redisClient    = require('lib/redis');

const observer = (fileSaver, redisTable) => {

  let enableSave = true;
  redisClient.getMultiTable(redisTable)
  .then(async (res) => {
    if(enableSave) {
      enableSave = false;
      
      await fileSaver.fileUpdateArbInfo(res, redisTable);  
      enableSave = true;

    }

  });
}

module.exports = observer;














