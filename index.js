require('dotenv').config();
var striptags = require('striptags');
var request = require('request');
var TelegramBot = require('node-telegram-bot-api');

var token = process.env.TELEGRAM_BOT_TOKEN;
// See https://developers.openshift.com/en/node-js-environment-variables.html
var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
var host = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';
var domain = process.env.OPENSHIFT_APP_DNS;

var adstatusurl = 'https://mfgt-api.appspot.com/api/v1/aerodromestatus';
var resurl = 'https://mfgt-api.appspot.com/api/v1/reservations';

var polling_options = { polling: true };
var webhook_options = {webHook: {port: port, host: host}};

var options = domain ? webhook_options : polling_options;

var bot = new TelegramBot(token, options);
// OpenShift enroutes :443 request to OPENSHIFT_NODEJS_PORT
if (domain) {
  bot.setWebHook(domain+':443/bot'+token);
}

bot.on('message', function (msg) {
  var chatId = msg.chat.id;
console.log(msg.text);
  if (msg.text == '/status') {
    request({'url': adstatusurl}, function(error, response, body) {
      var status = JSON.parse(body);
      var msg = striptags(status.message);
      bot.sendMessage(chatId, msg, {'parse_mode': 'HTML'});
      console.log(body);
    });
  } else if (msg.text == '/webcam') {
    request({'url': adstatusurl}, function(error, response, body) {
      var status = JSON.parse(body);
      console.log(body);
      request({'url': status.webcam.cams.east.high, 'encoding': null}, function(error, response, east) {
        request({'url': status.webcam.cams.west.high, 'encoding': null}, function(error, response, west) {
          bot.sendPhoto(chatId, east);
          bot.sendPhoto(chatId, west);
        });
      });
    });
  } else if (msg.text == '/start') {
    bot.sendMessage(chatId, "Welcome to the LSZT bot");
  } else {
    bot.sendMessage(chatId, "Command not found: " + msg.text);
  }
});
