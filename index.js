/* jshint esversion:6 */

const io = require('socket.io')(3004);
const Twitter = require('node-tweet-stream');
const stream = new Twitter(require('./config.json'));

const match = (d, string) => {
  const regex = new RegExp(string, 'i');

  return (d.quoted_status && d.quoted_status.text.match(regex)) ||
    (d.retweeted_status && d.retweeted_status.text.match(regex)) ||
    (d.extended_tweet && d.extended_tweet.full_text.match(regex)) ||
    d.text.match(regex);
};

const type = (d) => {
  if (match(d, 'trump')) {
    return (match(d, 'clinton')) ? 'B' : 'A';
  }
  else if (match(d, 'clinton')) {
    return 'C';
  }
  else {
    return null;
  }
};

const tracker = {};

io.on('connection', () => {
  stream.on('tweet', (tweet) => {
    if (tracker[tweet.id]) {
      return;
    }

    const t = type(tweet);

    if (t) {
      tracker[tweet.id] = true;
      io.emit('tweet', Object.assign(tweet, {
        type: t,
        state: 'active'
      }));

      if (Math.random() < 0.5 && t === 'A') {
        setTimeout(() => {
          io.emit('transition', tweet.id, 'B');
        }, 2500);

        setTimeout(() => {
          io.emit('update', tweet.id, 'inactive');
        }, 7500);

        setTimeout(() => {
          io.emit('update', tweet.id, 'dropoff');
        }, 10000);
      }
      else {
        setTimeout(() => {
          io.emit('update', tweet.id, 'inactive');
        }, 2500);

        setTimeout(() => {
          io.emit('update', tweet.id, 'dropoff');
        }, 5000);
      }
    }
  });

  stream.on('error', (error) => {
    io.emit('error', error);
  });

  stream.language('en');
  stream.track('trump');
  stream.track('clinton');
});
