# Personal Node Radio
Personal Node Radio is a node-based personal radio (as the name said ;) that uses Shoutcast streams, node and blacklists to filter out songs from a set of stations. It is mainly based on the [icecast-stack](https://github.com/ashtuchkin/node-icecast-stack) project from [TooTalNate](https://github.com/TooTallNate). This idea came to my mind, when I was listening to some Shoutcast stations during work. I realized that at some point I was only switching between stations, because I didn't like the song, or it was advertisment. Then I thought, it would be cool if I could automate this process and let a simple script decide when to switch stations. And, well, here it is, my first basic version of this idea.

This README is seperated into four major topics: Install that thing, customize it, how it works and future work.

## Install
As the name said, this project is based on node. And node (+ it's package manager ``npm``) is the only dependency you'll need. See [Node.js](http://nodejs.org/) for the installation on your system.

First you have to clone the repo:

```
git clone https://github.com/23tux/personal_node_radio.git
```

Then switch to your cloned repo dir and install the dependencies with ``npm``:

```
cd personal_node_radio
npm install
```

Now you can start the whole thing up and listen to some music:

```
node start.js
```

The server connects by default to ``localhost:9000``. You can change this by starting the script with two parameters:

```
node start.js 10.0.0.5 9001
```

Now use your favourite client to connect to ``http://localhost:9000`` and listen to music! (e.g. use VLC with File ⟶ Open Network).

After a while a song or advertisment will appear that you don't like (I'm sure…). To vote down this song and add it to the blacklist, you can use the ``dnode_vote.js`` script with a parameter:

```
// vote up
node dnode_vote.js 1

// vote down
node dnode_vote.js -1
```

This script will connect to a dnode server inside the ``start.js`` file and tell him to down- or upvote the current song. After that the current metadata of the active station gets added to the blacklist.txt or whitelist.txt.

If you want to automate the vote script, and you are on a mac, you can use the ``VotePersonalRadioDown.workflow`` and ``VotePersonalRadioUp.workflow`` Automator script to handle this. The only thing is, that before clicking on the ``.workflow`` file, you have to edit the path, where this repo is located. This is done inside the ``document.wflow`` file. Search for this line


```
<string>/usr/local/bin/node /Users/23tux/Dropbox/projects/node/personal_node_radio/dnode_vote.js -1</string>
```

and replace it with the absolute path to your node binary and the path to the ``dnode_vote.js`` script. Once you've done, double click the ``.workflow`` file and click on *Install*. Now the workflow gets installed as a service on your machine. Inside your System *Preferences ⟶ Keyboard ⟶ Keyboard Shortcuts* choose *Service*, scroll down, search for the VotePersonalRadioDown name and you can assign a system-wide shortcut to the scripts. From that, the server can run in the background and you can skip a song from point of your system.

## Customize

The project hold it's data in the ``data`` dir. There you have a ``blacklist.txt``, ``whitelist.txt`` and a ``stations.json``. Have a look into the JSON file. Here you can configure which stations should be played:

```
[
  {"name": "181.fm - The Eagle (Your Home For REAL Classic Rock!)", "url": "http://108.61.73.118:8030"},
  {"name": "Rockantenne Live", "url": "http://mp3channels.webradio.antenne.de/classic-rock-live"},
  {"name": "FM4", "url": "http://194.232.200.150:8000"},
  {"name": "181.FM - The Buzz (Your Alternative Station!)", "url": "http://108.61.73.119:8126"},
  {"name": "Aardvark Blues FM", "url": "http://174.36.206.217:8873"},
  {"name": "Pink Narodna Muzika", "url": "http://62.212.82.115:80"},
  {"name": "All Irish Dublin", "url": "http://206.190.130.180:8526"},
  {"name": "Irish Favourites", "url": "http://176.31.240.114:8326"},
  {"name": "181.FM - Christmas Mix", "url": "http://69.4.232.112:8982"}
]
```

This are my favourites. Feel free to search on [shoutcast.com](http://shoutcast.com) for your own stations. If you have found some, download the ``*.pls`` files, look for the URL and the port and insert it into the ``stations.json`` file.

The ``blacklist.txt`` contains the songs that you don't like. You can edit them, but be sure to restart the server afterwards. The ``whitelist.txt`` contains the songs that you like, but this list has no impact on the current project. It's just for tracking.

## How it works

When I began working on this project, I first had a look at an audio stream from a shoutcast server. I tried to extract the metadata from the stream by opening a socket to it and parsing the metadata. This stackoverflow post helped me lot [Stackoverflow: Pulling Track Info From an Audio Stream Using PHP](http://stackoverflow.com/questions/4911062/pulling-track-info-from-an-audio-stream-using-php/4914538#4914538). I came up with a hacky solution like this:

```
var net = require('net');

var socket = new net.Socket();
socket.connect(8030, "108.61.73.118", function() {
    // Send a HTTP Header to the server with Icy-MetaData:1 to receive the stream with metadata
    socket.write("GET / HTTP/1.1\n");
    socket.write("Accept: */*\n");
    socket.write("Referer: localhost:8000/\n");
    socket.write("User-Agent: SockSa\n");
    socket.write("Icy-MetaData:1\n\n");
});

var metaint;
var byte_count=0;
// parse the chunks of data for metadata information
socket.on('data', function(data) {
  // check if its metadata
  var icyindex = data.toString().indexOf("icy-metaint");
  if(icyindex!=-1) {
    metaint = parseInt(data.toString().substr(icyindex, 18).split(":")[1]);
    byte_count += data.length;
  } else {
    // of not, its raw audio data, where metadata is injected
    byte_count += data.length;
    if(byte_count>=metaint) {
      var offset = byte_count-metaint;
      var len = data.toString().substr(offset+1, 1).charCodeAt(0);
      console.log(data.toString().substr(offset, len))
      socket.destroy();
    }
  }
});

// Add a 'close' event handler for the client socket
socket.on('close', function() {
    console.log('Connection closed');
});

socket.on('error', function(evt) {
  console.log(evt)
});
```
I got some problems finding the right position of the metadata, but I received parts of it. Luckily, I found the npm package icecast-stack which does all that stuff for you, and even more. It offers metadata extraction, reading a stream... From that point it was easy to put the parts together.

Basically the project consists of the following parts:

* start.js: Starts the switcher and the dnode_server
* switch_enginge.js: Handles the logic of switching between stations, creating the server and handling errors. It also holds the ``global.CLIENTS`` array, where all the connected clients are stored, and where the stations are writing data
* server.js: Creates a HTTP server for the clients
* station.js: Connects to a shoutcast stream, emits metadata events and writes to the ``global.CLIENT`` array, if active
* data.js: Parses the station data and the black- and whitelists
* dnode_server.js: Creates a dnode server and listens for events to control the up- and downvote process
* dnode_vote.js: The script which sends messages for voting to the dnode_server.js
* helper.js: Just some helper functions for logging and retrieving random numbers

The SwitchEngine is the control part of the application. First, it creates the stations and sets a random station to active:

``switch_enginge.js:13``

```
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
});
```

The ``createStations`` method just parses the data from the Data class and puts them in the stations array. The ``setActiveStation`` function is in charge of handling activating and deactivating stations. A station as an argument is needed for this. It first deactivates all stations, removes all eventlisteners and then activates the station that was in the arguments. It attaches an metadata event listener to it and checks if the current track is in the blacklist.

That leads us to the ``inBlacklist`` method. This method has a track as an argument and checks, if this track is inside the blacklist. If so, the ``setActiveStation`` methods tries to find another station by calling the ``findStation`` method:

``switch_enginge.js:66``

```
// Returns a station where a song is played, that is not in the blacklist
SwitchEngine.prototype.findStation = function() {
  for (var i=0; i < this.stations.length; i++) {
    var s = this.stations[i];
    if(!inBlacklist(s.currentTrack)) {
      return s;
    };
  };
}
```

The method interates over all stations and compares every current track with the playlist. If a station is found which current track isn't in the blacklist, that one is returned. The other methods of the SwitchEngine are for up- and downvote, triggering a station switch.

To provide the clients a server, we need to create one. This is done in the ``server.js`` (sic! ;). The server handles the connections to the clients (e.g. writing headers), and when a client requests data, it gets pushed to the ``global.CLIENTS`` array (located in the SwitchEngine).

``server.js:4``

```
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
```

When a request is received, the server checks if a station is currently active. If not, maybe all stations are dead and we can't serve any data. After that, it writes the header by calling the ``writeHeaders`` method:

``server.js:28``

```
// writes the headers
Server.prototype.writeHeaders = function(req, res) {
  var headers = {
    "Content-Type": "audio/mpeg",
    'Transfer-Encoding': 'chunked'
  }
  
  res.writeHead(200, headers);
}
```

We responed with a content-type of audio/mpeg (for other types we would need to decode and encode the audio data, see the Improvements & Future Work section below), and setting the ``Transfer-Encoding`` to ``chunked``. We could also use *identity* as the transfer encoding, because most of the shoutcast streams are served with ``'Transfer-Encoding': 'chunked'``. But to be sure, set it to chunked.

Hey, we got a switch engine and a server. But no data. Lets do this in the ``station.js`` by connecting to a shoutcast stream. The station has some attributes, like ``active`` to know if it is active, should emit metadata and write the data to the client. The good thing about the metadata event is, that when this is emitted usually a new song is played. The main part of the metadata extraction is this:

``station.js:54``

```
// When a 'metadata' event happens, usually a new song is starting.
self.stream.on('metadata', function(metadata) {
  self.currentTrack = icecast.parseMetadata(metadata).StreamTitle;
  if(self.active) {
    self.emit('metadata', self.currentTrack, self.name);
  }
});
```

We can use the metadata event from the icecast-stack package, and use that very handy function ``icecast.parseMetadata(metadata).StreamTitle`` to get the current track. The next important part is writing the data to the clients. When receiving the data event from the stream, the station checks if itself is active, and then writes the data to all the connected clients inside the ``global.CLIENTS`` array.

``station.js:43``

```
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
```

That were the main parts of the application. I think if you have a look into the source code, my comments will help you to understand that whole thing. If you have any questions, feel free to contact me!

## Improvments & Future Work
There are a lot of things that could be improved. Here are some things that I might do in the future:

* Cross-fade songs when a station is switched would be much nicer
* For now, the raw data chunks are only delegated to the clients, there is no encoding or decoding. Using Lame or mplayer to convert the stream into a clear MP3 or OGG format would open the possibility, to use the stream in a browser
* The metadata from the streams and the content of the blacklist is only ``==`` compared. A fuzzy matching with [Levenshtein distance](http://en.wikipedia.org/wiki/Levenshtein_distance) or [Jaro-Winkler distance](http://en.wikipedia.org/wiki/Jaro%E2%80%93Winkler_distance) could give a more flexible way to compare the strings between stations. Not every station has the same metadata format, some of them are putting a ``-`` between artist and song and some don't
* Implement a way for recognizing artist and song seperatly. If this works, seperate blacklist could decide if you just don't like the song or the artist. Maybe this could be done with the Shazam-like project [Echoprint](http://echoprint.me/), where you could send audio data to it, and it would tell you what song is currently played.
* A recommender system with [Collaborative Filtering](http://en.wikipedia.org/wiki/Collaborative_filtering) could be used to find out which stations, artist, songs, genre… you like or you dislike. Drawback: A community is needed.
* Better content-based filtering
* Implement a caching strategy, so we don't dependent on the real time data from the stations. After a while, you would have a library of songs as real data on your harddisk, and they could be played in every order you want (e.g. what the recommender system decides)
* A webpanel where you can search shoutcast.com for new stations, manage existing stations, edit the black- and whitelists...
* Take all this ideas, create personal radio streams for each customer, make a big project and then: Make real money ;)

## Contributing

Feel free to fork the project and improve that thing! If you have any other ideas for the Improvements & Future Work section, please let me know at [info@sketchit.de](mailto:info@sketchit.de).

## Copyright

Copyright (c) 2012, Hubert Hölzl

Released under the terms of the BCD license. See LICENSE for details.