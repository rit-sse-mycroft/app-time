var APP_NAME = 'time';
// Probability Mycroft will be rude and sacrastic
var CHANCE_OF_SARCASM = 0.01;
var path = require('path')
var fs = require('fs');
var Mycroft = require('mycroft');
//var Mycroft = require('./mycroft.js');
var client = new Mycroft('time', './app.json', 'localhost', 1847);

var sentGrammar = false; // Set to true when grammar has successfully been sent.

// Handler for CONNECTION_CLOSED
client.on('CONNECTION_CLOSED', function(data) {
  client.query('stt', 'unload_grammar', {grammar: 'time'}, ['stt1'], 30);
});

// Handler for APP_DEPENDENCY
client.on('APP_DEPENDENCY', function(data){
  if(client.dependencies.stt.stt1 !== undefined && client.dependencies.tts !== undefined) {
    if(client.dependencies.stt.stt1 === 'up' && !sentGrammar){
      var grammarData = {
        grammar: {
          name: 'time',
          xml: fs.readFileSync('./grammar.xml').toString()
        }
      };
      client.query('stt', 'load_grammar', grammarData, ['stt1'], 30);
      sentGrammer = true;
    }else if(client.dependencies.stt.stt1 === 'down' && sentGrammar){
      sentGrammar = false;
    }
    if(client.status.down && client.dependencies.tts.text2speech === 'up' && client.dependencies.stt.stt1 === 'up'){
      up();
    }else if(client.status.up &&(client.dependencies.tts.text2speech === 'down' || client.dependencies.stt.stt1 === 'down')){
      down();
    }
  }
});

// Handler for MSG_BROADCAST
client.on('MSG_BROADCAST', function(data){
  if(data.content.grammar === 'time') {
    if(data.content.text.indexOf('time') !== -1){
      sayTime(data);    
    }
    if(data.content.text.indexOf('date') !== -1 || data.content.text.indexOf('today') !== -1 || data.content.text.indexOf('day') !== -1){
      sayDate();
    }
  }
});


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

  // Build the string.
  var message = pick([
    pick(['It is', 'It\'s']) + ' ' + pick(['', 'currently ']),
    'The ' + pick(['', 'current ']) + 'time is '
  ]);
  
  //checks to see if mycroft will try to be funny
  if (Math.random() < CHANCE_OF_SARCASM) {
    message += 'now.';

    //if its no being sarcastic it just says the time...
  } else {
    message += hour + ':';
    message += (minute < 10 ? '0' : '') + minute + ' '; // Add a zero before a minute value less than ten.
    message += isAM ?
        pick(['A.M.', 'in the morning.']) :
        pick(['P.M.', (hour < 6 ? 'in the afternoon.' : 'in the evening.')]);
    }
  console.log('Reporting the time as \"' + message + '\"');
  sayMessage(message);
}

// Say the current day
function sayDate() {
  var message = pick(['Today is', 'The date is', '']);
  var now = new Date();
  var day = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][now.getDay()];
  var date = now.getDate() + ["th", "st", "nd", "rd", "th", "th", "th", "th", "th", "th"][now.getDate()%10];
  message = message + ' ' + day + ' the ' + date;
  console.log('Reporting the date as \"' + message + '\"');
  sayMessage(message);
}


// Send a given message to TTS
function sayMessage(message) {
  var data = {
    text: [{
      phrase: message,
      delay: 0
    }],
    targetSpeaker: 'speakers'
  };
  // Send the data to TTS.
  client.query('tts', 'stream', data, ['text2speech'], 30);
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

client.connect();
client.sendManifest();
