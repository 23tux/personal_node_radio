var fs = require('fs');
var blacklistPath = "./data/blacklist.txt";
var whitelistPath = "./data/whitelist.txt";

// holds the data for white and black lists
function Data() {
  var self = this, lines;
  self.stations = require('./data/stations');
  self.blacklist = [];
  self.whitelist = [];
  fs.readFile(blacklistPath, 'utf8', function(err,data) {
    if( ! err ) {
      self.blacklist = data.split("\n");
    }
  });
  fs.readFile(whitelistPath, 'utf8', function(err,data) {
    if( ! err ) {
      self.whitelist = data.split("\n");
    }
  });
}

// adds another line to the blacklist
Data.prototype.addToBlackList = function(str) {
  this.blacklist.push(str);
  fs.appendFile(blacklistPath, "\n" + str, function (err) {
  });
}

// adds another line to the whitelist
Data.prototype.addToWhiteList = function(str) {
  this.whitelist.push(str);
  fs.appendFile(whitelistPath, "\n" + str, function (err) {
  });
}

module.exports = Data;
