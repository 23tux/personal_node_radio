var dnode = require('dnode');
var events = require('events');

function DNodeServer() {
  var self = this;
  var dnode_server = dnode({
      vote : function (value, callback) {
        if(value=="1") {
          console.error("Upvote for current track received!".red.bold)
          // emit the event, so that the switcher can catch it
          self.emit('vote', 1);
          callback("Upvote stored!");
        } else if(value=="-1") {
          console.error("Downvote for current track received!".red.bold)
          // emit the event, so that the switcher can catch it
          self.emit('vote', -1);
          callback("Downvote stored!");
        }
      }
  });
  dnode_server.listen(5004);
}

// needed for firing events
DNodeServer.prototype = new events.EventEmitter;
module.exports = DNodeServer