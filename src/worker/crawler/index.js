const _ = require('lodash');

const config = require('config').marketConfig;
const { bithumbCrawler, coinoneCrawler, upbitCrawler, gopaxCrawler, bitfinexCrawler,
        huobiCrawler, poloniexCrawler, binanceCrawler } = require('lib/crawler');

/**
 * @description 
 *   Market which is using REST API.
 *     1. BITHUMB
 *     2. GOPAX
 */

const BithumbCrawler = new bithumbCrawler();
BithumbCrawler.getQuotes(1000);

const GopaxCrawler = new gopaxCrawler();
config.gopax.crawl_list.forEach(coin => {
  GopaxCrawler.getQuotes(coin, 1000);
});

/**
 * @description 
 *   Market which is using websocket.
 *     1. UPBIT
 *     2. COINONE
 *     3. BITFINEX
 *     4. HUOBI
 *     5. POLONIEX
 *     6. BINANCE
 */

const UpbitCrawler = new upbitCrawler();
UpbitCrawler.getQuotes();
UpbitCrawler.checkHeartBeat();

const CoinoneCrawler = new coinoneCrawler();
config.coinone.crawl_list.forEach(coin => {
  CoinoneCrawler.getQuotes(coin,'KRW');
});
CoinoneCrawler.checkHeartBeat();

const BitfinexCrawler = new bitfinexCrawler();
BitfinexCrawler.getQuotes();

const HuobiCrawler = new huobiCrawler();
HuobiCrawler.getQuotes();

const PoloniexCrawler = new poloniexCrawler();
PoloniexCrawler.getQuotes();

const BinanceCrawler = new binanceCrawler();
BinanceCrawler.getQuotes();
