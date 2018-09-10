const koreaAggregate = require('./koreaAggregate');
const setIntervalTime = 300;

const KoreaAggregate = new koreaAggregate();


function main () {
  // korea market all coin orderbook aggregate.
  KoreaAggregate.makeAggregateBook();
}

setInterval(main, setIntervalTime);



