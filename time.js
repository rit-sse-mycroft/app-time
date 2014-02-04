var APP_NAME = 'time';
// Probability Mycroft will be rude and sacrastic
var CHANCE_OF_SARCASM = 0.001;
// Probability Mycroft will be to give the exact time
var CHANCE_OF_PRECISE_TIME = 0.3;
// How far from 0, 15, 30, or 45 is considered close enough.
var CLOSE_ENOUGH_THRESHOLD = 2;

var fs = require('fs');
var mycroft = require('./mycroft.js');
var client = mycroft.Mycroft('./app.json', 'localhost', 1847);

var sentGrammar = false; // Set to true when grammar has successfully been sent.


client.on('APP_MANIFEST_OK', function(data){
  client.appManifestOk();
});

client.on('APP_MANIFEST_FAIL', function(data){
  client.appManifestFail();
});

client.on('MSG_GENERAL_FAILURE', function(data){
  client.msgGeneralFailure(data);
});


client.on('CONNECTION_CLOSED', function(data) {
  client.query('stt', 'unload_grammar', {grammar: 'time'}, ['stt1'], 30);
  client.down();
});

client.on('APP_DEPENDENCY', function(data){
  client.updateDependencies(data);
  if(client.dependencies.stt !== undefined && client.dependencies.tts !== undefined) {
    if(client.stt.stt1 === 'up' && !sentGrammar){
      var grammarData = {
        grammar: {
          name: 'time',
          xml: fs.readFileSync('./grammar.xml').toString()
        }
      };
      app.query(client, 'stt', 'load_grammar', grammarData, ['stt1'], 30);
      sentGrammer = true;
    }else if(client.dependencies.stt.stt1 === 'down' && sentGrammar){
      sentGrammar = false;
    }
    if(client.status.down && client.dependencies.tts.text2speech === 'up' && client.dependencies.stt.stt1 === 'up'){
      up();
    }else if(client.status.up &&(client.dependencies.tts.text2speech === 'down' && client.dependencies.stt.stt1 === 'down')){
      down();
    }
  }
});

client.on('MSG_BROADCAST', function(data){
  if(data.content.grammar === 'time') {
    sayTime(data);
  }
});

client.connect();
client.sendManifest();

// Say the current time
// data is the data from a message (as JSON)
function sayTime(data) {
  // Get the current (12-hour) time.
  var now = new Date();
  var hour = now.getHours();
  var isAM = hour < 12;
  if (hour > 12) { hour -= 12; }
  if (hour === 0) { hour = 12; }
  var minute = now.getMinutes();
  //var seconds = now.getSeconds();
  var millis = now.getTime();
  // Say the precise time if the user requested it or based on random chance.
  var preciseTime = data.content.text.indexOf('exact') !== -1 ||
    data.content.text.indexOf('precise') !== -1 ||
    Math.random() < CHANCE_OF_PRECISE_TIME;
  var tellMillis = data.content.text.indexOf('milliseconds') !== -1 ||
    data.content.text.indexOf('millis') !== -1;

  // Build the string.
  var message = pick([
    pick(['It is', 'It\'s']) + ' ' + pick(['', 'currently ']),
    'The ' + pick(['', 'current ']) + 'time is '
  ]);

  if (Math.random() < CHANCE_OF_SARCASM) {
    message += 'now.';
  } else if (tellMillis) {
    message += millis;
    message += ' milliseconds after the epoch.';
  } else {
    if (preciseTime) {
      message += hour + ':';
      message += (minute < 10 ? '0' : '') + minute + ' '; // Add a zero before a minute value less than ten.
      message += isAM ? 'A.M.' : 'P.M.';
    } else {
      // If the time is at or near a multiple of 15...
      if (minute % 15 <= CLOSE_ENOUGH_THRESHOLD ||
          15 - (minute % 15) <= CLOSE_ENOUGH_THRESHOLD) {
        // Indicate if the time is an estimate.
        if (minute % 15 !== 0) {
          message += pick(['about', 'around', 'approximately']) + ' ';
        }
        if (minute <= CLOSE_ENOUGH_THRESHOLD) {             // XX:00
          message += hour + ' ' + pick(['', 'o\'clock']);
        } else if (minute >= 15 - CLOSE_ENOUGH_THRESHOLD &&
            minute <= 15 + CLOSE_ENOUGH_THRESHOLD) { mm     // XX:15
          message += 'a quarter ' + pick(['after', 'past']) + ' ';
          message += hour + ' ';
        } else if (minute >= 30 - CLOSE_ENOUGH_THRESHOLD &&
            minute <= 30 + CLOSE_ENOUGH_THRESHOLD) {        // XX:30
          message += 'half past ';
          message += hour + ' ';
        } else if (minute >= 45 - CLOSE_ENOUGH_THRESHOLD &&
            minute <= 45 + CLOSE_ENOUGH_THRESHOLD) {        // XX:45
          message += 'a quarter ' + pick(['\'til', 'to', 'until']) + ' ';
          message += (hour + 1 > 12 ? hour + 1 : 1) + ' ';
        } else if (minute >= 60 - CLOSE_ENOUGH_THRESHOLD) { // XX:59
          message += (hour + 1 > 12 ? hour + 1 : 1) + ' ';
          message += pick(['', 'o\'clock']);
        }
      } else { // Some other time.
        if (minute < 30) {
          message += minute + ' minutes ' + pick(['after', 'past']) + ' ';
          message += hour + ' ';
        } else {
          message += (60 - minute) + ' minutes ' + pick(['\'til', 'to', 'until']) + ' ';
          message += (hour + 1 > 12 ? hour + 1 : 1) + ' ';
        }
      }
      message += isAM ?
        pick(['A.M.', 'in the morning.']) :
        pick(['P.M.', (hour < 6 ? 'in the afternoon.' : 'in the evening.')]);
    }
  }
  console.log('Reporting the time as \"' + message + '\"');
  sayMessage(message);
}

// Say the current day
function sayDate() {
  var now = new Date();
  var day = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][now.getDay()];
  var date = now.getDate() + ["th", "st", "nd", "rd", "th", "th", "th", "th", "th", "th"][now.getDate()%10];
  console.log('Reporting the date as \"' + message + '\"');
  sayMessage(message);
}


// Send a given message to TTS
function sayMessage(message) {
  // Do not attempt to send a message if not yet verified.
  if (!client.verified) {
    console.error('Attempted to send message before verification.');
  }
  var data = {
    text: [{
      phrase: message,
      delay: 0
    }],
    targetSpeaker: 'speakers'
  };
  // Send the data to TTS.
  app.query(client, 'tts', 'stream', data, ['text2speech'], 30);
}

// Pick an item from a list.
// items is an array of items from which to pick
function pick(items) {
  if(items.length === 0) {
    console.error('Function pick expects items to pick from.');
  }
  items.sort(function() { return Math.random() - 0.5; });
  return items[0];
}
