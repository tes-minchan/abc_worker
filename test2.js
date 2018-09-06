const slackBots = require('slackbots');
const config = {
  token : "xoxb-219103622912-429987589571-hwmdrbHV470vEqOjRha9S0N0",
  name  : "abc-signal",
  channel : "t1-10_abc-signal"
}


const bot = new slackBots({
  token: config.token, 
  name: config.name
});
bot.postMessageToChannel(config.channel, "test", this.params);
