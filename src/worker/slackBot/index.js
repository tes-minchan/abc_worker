const slackBots = require('slackbots');
const config = {
  token : "xoxb-219103622912-429987589571-hwmdrbHV470vEqOjRha9S0N0",
  name  : "abc-signal",
  channel : "t1-10_abc-signal"
}

function slackBot () {

  this.bot = new slackBots({
    token: config.token, 
    name: config.name
  });
  
}

slackBot.prototype.sendMessage = function(getData) {
  const coinName = getData.coin;
  const data     = getData.data;
  let slackMsgFormat = {
    "attachments": [
        {
          "icon_emoji": ':alien:',
        }
    ]
  }
  console.log("send to slack message");
  console.log(coinName, data);

  let slackText = `Profit : ₩${Math.floor(data.profit)}, ${data.profitPercentage}%\n`;
  slackText += `AskMarket : ${data.minAskMarket}\nminAskPrice : ₩${data.minAskPrice}\nminAskVolume : ${data.minAskVolume}\n`;
  slackText += `BidMarket : ${data.maxBidMarket}\nmaxBidPrice : ₩${data.maxBidPrice}\nmaxBidVolume : ${data.maxBidVolume}\n`;
  slackText += `tradeVolume : ${data.minimumVolume}\nrequiredFunds : ₩${Math.floor(data.requiredFunds)}\n`

  slackMsgFormat.attachments[0]['title'] = coinName;
  slackMsgFormat.attachments[0]['text'] = slackText;
  slackMsgFormat.attachments[0]['ts'] = new Date().getTime() / 1000;

  this.bot.postMessageToChannel(config.channel, '', slackMsgFormat);

}

module.exports = slackBot;


