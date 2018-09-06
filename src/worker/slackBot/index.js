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

  this.params = {
    icon_emoji: ':alien:'
  }

  this.count = 0;
  
}

slackBot.prototype.sendMessage = function(data) {
  if(this.count++ < 200) {
    console.log("send to slack message");
    console.log(data);
    this.bot.postMessageToChannel(config.channel, data, this.params);
  }
}

module.exports = slackBot;


