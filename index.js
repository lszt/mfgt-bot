// An example for OpenShift platform.
var TelegramBot = require('node-telegram-bot-api');

var token = process.env.TELEGRAM_BOT_TOKEN;
// See https://developers.openshift.com/en/node-js-environment-variables.html
var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
var host = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';
var domain = process.env.OPENSHIFT_APP_DNS;

var request = require('request');
var adstatusurl = 'https://mfgt-api.appspot.com/api/v1/aerodromestatus';
var resurl = 'https://mfgt-api.appspot.com/api/v1/reservations';

console.log("domain: " + domain);

var bot = new TelegramBot(token, {webHook: {port: port, host: host}});
// OpenShift enroutes :443 request to OPENSHIFT_NODEJS_PORT
bot.setWebHook(domain+':443/bot'+token);


bot.on('message', function (msg) {
  if (msg == 'status') {
    request({'url': adstatusurl}, function(error, response, body) {
      var status = JSON.parse(body);
      bot.sendMessage(chatId, status.status);
      console.log('result');
      console.log(body);
    });
  } else {
    var chatId = msg.chat.id;
    bot.sendMessage(chatId, "Command not found: " + msg);
  }
});
