require('colors');
var http = require("http");

// creates the server that the clients can connect to
function Server() {
  var self = this;
  self.activeStation;
  
  // Listen on a web port and respond with a chunked response header.
  var server = http.createServer(function(req, res){
    // if no station is active
    if(self.inactiveStation.call(self, req, res)) { console.error("Can't serve audio stream, no active station connected".red.bold); return; };
    // writes the response headers
    self.writeHeaders.call(self, req, res);
    
    // Add the response to the clients array to receive streaming
    CLIENTS.push(res);
    console.log('Client connected; streaming');
  });
  server.listen(PORT, IP);
}

// sets the active station
Server.prototype.setActiveStation = function(station) {
  this.activeStation = station;
}

// writes the headers
Server.prototype.writeHeaders = function(req, res) {
  var headers = {
    "Content-Type": "audio/mpeg",
    'Transfer-Encoding': 'chunked'
  }
  
  res.writeHead(200, headers);
}

// tests if a station is active
// if not, respond with an 500 HTTP status
Server.prototype.inactiveStation = function(req, res) {
  if(typeof this.activeStation==='undefined') {
    res.writeHead(500);
    res.end();
    CLIENTS.push(res);
    return true;
  } else {
    return false;
  }
}

module.exports = Server;