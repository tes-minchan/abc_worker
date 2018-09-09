const slackBots = require('slackbots');
const config = {
  token : "xoxb-219103622912-429987589571-hwmdrbHV470vEqOjRha9S0N0",
  name  : "abc-signal",
  channel : "t1-10_abc-signal"
}

const string = `test\nprice : 1123\n volume : 123`;

const slackMsgFormat = {
  "attachments": [
      {
        "title": "QTUM",
        "icon_emoji": ':alien:',
      }
  ]
}

const bot = new slackBots({
  token: config.token, 
  name: config.name
});


slackMsgFormat.attachments[0]['ts'] = new Date().getTime() / 1000;

console.log(slackMsgFormat);
for(let i = 0; i< 3; i++) {
  slackMsgFormat.attachments[0]['text'] = `index : ${i}` + string;

  bot.postMessageToChannel(config.channel, i, slackMsgFormat);
}
