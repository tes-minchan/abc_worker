const _ = require('lodash');

const config = require('config').marketConfig;
const { bithumbCrawler, coinoneCrawler, upbitCrawler, gopaxCrawler } = require('lib/crawler');

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
 */

const UpbitCrawler = new upbitCrawler();
UpbitCrawler.getQuotes();
UpbitCrawler.checkHeartBeat();

const CoinoneCrawler = new coinoneCrawler();
config.coinone.crawl_list.forEach(coin => {
  CoinoneCrawler.getQuotes(coin,'KRW');
});
CoinoneCrawler.checkHeartBeat();
