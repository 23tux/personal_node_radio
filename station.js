var events = require('events');
var http = require('http');
var icecast = require('icecast-stack');

// Holds the data for the station
function Station(data) {
  var self = this;
  this.data = data;
  this.name = data.name
  this.url = data.url;
  this.active = false;
  this.connected = false;
  this.reconnects = 0;
  this.currentTrack;
  this.stream;

  this.init.call(this);
}
// needed for emitting events
Station.prototype = new events.EventEmitter;

// inits the station
Station.prototype.init = function() {
  // first clear up the station
  this.destroy.call(this);
  
  var self = this;
  
  // create a new icecast station based on an url
  self.stream = icecast.createReadStream(self.url);
  
  // when connected, set connected to true
  self.stream.on("connect", function() {
    green("Station " + self.name + " connected.");
    self.connected = true;
    self.emit('connect');
  });

  // Fired after the HTTP response headers have been received.
  self.stream.on('response', function(res) {
  });

  // gets called when chunks of data are retrieved
  self.stream.on("data", function (chunk) {
    if(self.active) {
      if (CLIENTS.length > 0){
          for (client in CLIENTS){
            CLIENTS[client].write(chunk);
          };
      }
    }
  });

  // When a 'metadata' event happens, usually a new song is starting.
  self.stream.on('metadata', function(metadata) {
    self.currentTrack = icecast.parseMetadata(metadata).StreamTitle;
    if(self.active) {
      self.emit('metadata', self.currentTrack, self.name);
    }
  });
  
  // if a connection is closed, try to reopen it
  self.stream.on("close", function(evt) {
    self.reconnects++;
    // after 5 tries don't try again, and emit the broken event
    if(self.reconnects > 5) {
      self.emit('broken', self.data);
      return;
    }
    
    blue("Connection to " + self.url + " was closed! Reconnect #" + self.reconnects + " in 1.5s.");
    setTimeout(function() { self.init.call(self); }, 1500);
  });
  
  // if some error occures, log them
  self.stream.on("error", function(evt) {
    red("An error occured: " + evt, true)
  });
}

// removes every eventlistener
Station.prototype.destroy = function() {
// todo remove all eventlisteners
}

module.exports = Station;