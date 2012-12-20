global.puts = function(msg) { console.error(msg); }

global.green = function(msg, bold) {
  if(bold=="bold" || bold==true) {
    console.error(msg.green.bold);
  } else {
    console.error(msg.green);
  }
}

global.red = function(msg, bold) {
  if(bold=="bold" || bold==true) {
    console.error(msg.red.bold);
  } else {
    console.error(msg.red);
  }
}

global.blue = function(msg, bold) {
  if(bold=="bold" || bold==true) {
    console.error(msg.blue.bold);
  } else {
    console.error(msg.blue);
  }
}

global.magenta = function(msg, bold) {
  if(bold=="bold" || bold==true) {
    console.error(msg.magenta.bold);
  } else {
    console.error(msg.magenta);
  }
}

global.cyan = function(msg, bold) {
  if(bold=="bold" || bold==true) {
    console.error(msg.cyan.bold);
  } else {
    console.error(msg.cyan);
  }
}

global.white = function(msg, bold) {
  if(bold=="bold" || bold==true) {
    console.error(msg.white.bold);
  } else {
    console.error(msg.white);
  }
}

global.getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}