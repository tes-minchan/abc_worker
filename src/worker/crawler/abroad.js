const { bitfinexCrawler, huobiCrawler, poloniexCrawler, binanceCrawler } = require('lib/crawler');

/**
 * @description 
 *   Market which is using websocket.
 *     3. BITFINEX
 *     4. HUOBI
 *     5. POLONIEX
 *     6. BINANCE
 */

const BitfinexCrawler = new bitfinexCrawler();
BitfinexCrawler.getQuotes();

const HuobiCrawler = new huobiCrawler();
HuobiCrawler.getQuotes();

const PoloniexCrawler = new poloniexCrawler();
PoloniexCrawler.getQuotes();

const BinanceCrawler = new binanceCrawler();
BinanceCrawler.getQuotes();
