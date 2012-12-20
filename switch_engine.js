// global variable for holding the client connections
// this var gets written and read inside the stations.js and server.js
global.CLIENTS = []

var Station = require("./station");

var d = require('./data');
var Data = new d();

var s = require("./server");
var Server = new s();

function SwitchEngine() {
  var self = this;
  self.stations = [];
  // create the stations from the data object
  self.createStations.call(self);

  // set random station to active
  var rnd = getRandomInt(0, self.stations.length-1);
  // listen for the connect event of the random station
  // when connected, set this station as the active station
  self.stations[rnd].on("connect", function() {
    self.setActiveStation.call(self, self.stations[rnd]);
  });
}

// Creates the stations from the Data.stations array
SwitchEngine.prototype.createStations = function() {
  for (var i=0; i < Data.stations.length; i++) {
    var s = new Station(Data.stations[i]);
    s.on("broken", this.stationBroken)
    this.stations[i] = s;
  };
}

// This method is for switching between the stations
// first it sets every station to inactive, so that no more old metadata calls are fired
// then it sets the chosen station to active and bind an eventlistener for the metadata event
SwitchEngine.prototype.setActiveStation = function(station) {
  var self = this;
  
  for (var i=0; i < self.stations.length; i++) {
    self.stations[i].active = false;
    self.stations[i].removeAllListeners('metadata');
  };
  
  station.active = true;
  
  station.on('metadata', function(track, stationName) {
    magenta(track + "   ----   station: " + stationName.bold);
    
    // if the track is in the blacklist, find another station
    // here is the important part:
    // If the next track is in the blacklist, switch to another station
    if(inBlacklist(track)) {
      self.setActiveStation(self.findStation());
    }
  });
  
  // tell the server the new active station
  Server.setActiveStation(station);
  blue("Switched to station " + station.name + ", " + station.currentTrack);
}

// Returns a station where a song is played, that is not in the blacklist
SwitchEngine.prototype.findStation = function() {
  for (var i=0; i < this.stations.length; i++) {
    var s = this.stations[i];
    if(!inBlacklist(s.currentTrack)) {
      return s;
    };
  };
}

// gets called if a station is broken
SwitchEngine.prototype.stationBroken = function(data) {
  red("Station ist broken: " + data.name);
}

// adds the current song to the whitelist
// this isn't used yet, but maybe will be in the future
SwitchEngine.prototype.voteUp = function() {
  Data.addToWhiteList(Server.activeStation.currentTrack);
}

// adds the current song to the blacklist
// and switch to another station
SwitchEngine.prototype.voteDown = function() {
  Data.addToBlackList(Server.activeStation.currentTrack);
  this.setActiveStation(this.findStation());
}

// returns true if the current song is in the blacklist
function inBlacklist(current_track) {
  for (var i=0; i < Data.blacklist.length; i++) {
    var blacklist_track = Data.blacklist[i];
    if(current_track == blacklist_track) {
      red("BLACKLIST: '" + blacklist_track + " -->> Switching to other station!");
      return true;
    }
  };
  return false;
}

// export the module for use in other classes
module.exports = SwitchEngine;