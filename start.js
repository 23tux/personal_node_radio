require('./helper')

global.IP = process.argv[2] || "localhost";
global.PORT = process.argv[3] || 9000;

var switch_engine = require('./switch_engine')
var switcher = new switch_engine();

var DNodeServer = require('./dnode_server')
var dnode = new DNodeServer();
dnode.on("vote", function(value) {
  if(value==1) {
    switcher.voteUp();
  } else if(value==-1) {
    switcher.voteDown();
  }
})