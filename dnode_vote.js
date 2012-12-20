// Skript for calling the blacklist function

var dnode = require('dnode');

var d = dnode.connect(5004);
d.on('remote', function (remote) {
    remote.vote(process.argv[2], function (response) {
        console.log("Server response: " + response);
        d.end();
    });
});