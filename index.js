require('dotenv').config();
var striptags = require('striptags');
var request = require('request');
var TelegramBot = require('node-telegram-bot-api');
var strftime = require('strftime');

var token = process.env.TELEGRAM_BOT_TOKEN;
// See https://developers.openshift.com/en/node-js-environment-variables.html
var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
var host = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';
var domain = process.env.OPENSHIFT_APP_DNS;

var adstatusurl = 'https://mfgt-api.appspot.com/api/v1/aerodromestatus';
var resurl = 'https://mfgt-api.appspot.com/api/v1/reservations';

var polling_options = {
  polling: true
};
var webhook_options = {
  webHook: {
    port: port,
    host: host
  }
};

var options = domain ? webhook_options : polling_options;

var bot = new TelegramBot(token, options);
// OpenShift enroutes :443 request to OPENSHIFT_NODEJS_PORT
if (domain) {
  bot.setWebHook(domain + ':443/bot' + token);
}

var help = "Supported commands:\n/status - return aerodrome status\n/webcam - show current webcam images";

bot.onText(/\/contact/, function (msg) {
  var chatId = msg.chat.id;
  bot.sendContact(chatId, {
    'phone_number': '+41523663333'
  });
});

bot.on('message', function (msg) {
  console.log(msg.chat);
  var chatId = msg.chat.id;
  var cmd = msg.text ? msg.text.toLowerCase().trim() : "";
  cmd = cmd.charAt(0) == '/' ? cmd.substring(1) : cmd;
  console.log(msg.text + ':' + cmd);
  if (cmd == 'status') {
    bot.sendChatAction(chatId, 'typing');
    request({
      'url': adstatusurl
    }, function (error, response, body) {
      var status = JSON.parse(body);
      var msg = 'Status: ' + status.status + '\n' + striptags(status.message) + '\n- ' + strftime('%d.%m.%Y %H:%M ', new Date(status.last_update_date)) + ' ' + status.last_update_by;
      bot.sendMessage(chatId, msg, {
        'parse_mode': 'HTML'
      });
      console.log(body);
    });
  } else if (cmd == 'webcam') {
    bot.sendChatAction(chatId, 'upload_photo');
    request({
      'url': adstatusurl
    }, function (error, response, body) {
      var status = JSON.parse(body);
      console.log(body);
      request({
        'url': status.webcam.cams.east.high,
        'encoding': null
      }, function (error, response, east) {
        bot.sendPhoto(chatId, east);
        request({
          'url': status.webcam.cams.west.high,
          'encoding': null
        }, function (error, response, west) {
          bot.sendPhoto(chatId, west);
        });
      });
    });
  } else if (cmd == 'start') {
    bot.sendMessage(chatId, "Welcome to the LSZT bot");
  } else if (cmd == 'help') {
    bot.sendMessage(chatId, help);
  } else {
    bot.sendMessage(chatId, "Command not recognized." + help);
  }
});


function sendChat(msg) {
  var mfgt_chat_id = -1001071250873;
  bot.sendMessage(mfgt_chat_id, msg);
}

var Fbnotify = require("./fbnotify");
new Fbnotify({
  firebase: {
    serviceAccount: {
      projectId: process.env.FIREBASE_PROJECTID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_CLIENT_PRIVKEY,
    },
    databaseURL: process.env.FIREBASE_DATABASE_URL || "https://mfgt-flights.firebaseio.com",
  },
}, sendChat);