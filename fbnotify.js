var firebase = require("firebase");
var moment = require('moment-timezone');

var FirebaseListener = function (options, cb) {
  this.options = {
    firebase: {
      serviceAccount: "credentials.json",
      databaseURL: "https://mfgt-flights.firebaseio.com",
    },
    tz: "Europe/Zurich",
    locale: "de",
  };
  Object.assign(this.options, options);
  this.cb = cb;
  this.notify();
};

FirebaseListener.prototype.notifyMovement = function (val, id) {
  var dir = id == "departures" ? "dep" : "arr";
  var msg = dir + " " + moment(val.dateTime).locale(this.options.locale).tz(this.options.tz).format("L LT") + " " + val.immatriculation + " " + val.location + " " + val.lastname;
  this.cb(msg);
  console.log(msg);
}

FirebaseListener.prototype.notifyOnMovement = function (ref, arg) {
  var self = this;
  ref.once("value", function (snap) {
    console.log("conected");
    var keys = Object.keys(snap.val() || {});
    var lastIdInSnapshot = keys[keys.length - 1];
    ref.orderByKey().startAt(lastIdInSnapshot).on("child_added", function (valsnap) {
      if (valsnap.key === lastIdInSnapshot) {
        return;
      }
      self.notifyMovement(valsnap.val(), arg);
    });
  });
}

FirebaseListener.prototype.notify = function () {
  firebase.initializeApp(this.options.firebase);
  var db = firebase.database();
  var ref = db.ref("departures");
  this.notifyOnMovement(ref, "departures");
  ref = db.ref("arrivals");
  this.notifyOnMovement(ref, "arrivals");
};

module.exports = FirebaseListener;
