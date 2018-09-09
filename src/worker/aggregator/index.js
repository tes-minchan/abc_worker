const koreaAggregate = require('./koreaAggregate');
const setIntervalTime = 1000;

const KoreaAggregate = new koreaAggregate();


function main () {
  // korea market all coin orderbook aggregate.
  KoreaAggregate.makeAggregateBook();
}

setInterval(main, setIntervalTime);



