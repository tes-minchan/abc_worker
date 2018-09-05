const sleep = require('sleep');
const config = require('./src/config');
console.dir(config)
console.time('duration');

sleep.sleep(1);

console.timeEnd('duration');


