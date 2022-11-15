require('dotenv').config();
const dns = require('dns');
const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/public', express.static(`${process.cwd()}/public`));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const counterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  seq: {
    type: Number,
    default: 0,
  },
});

const counterModel = mongoose.model('counter', counterSchema);

const urlSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    unique: true,
  },
  seqId: {
    type: Number,
    unique: true,
  },
});

const urlModel = mongoose.model('urlModel', urlSchema);

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.post(
  '/api/shorturl',
  //Check formatting of url is ok
  function (req, res, next) {
    if (!req.body.url.match(/^https:\/\/www.+/)) {
      res.json({ error: 'Invalid URL' });
    } else {
      next();
    }
  },
  //Check url is an actual website
  function (req, res, next) {
    dns.lookup(req.body.url.slice(8), function (err, address) {
      if (err) {
        res.json({ error: 'Invalid URL' });
      } else {
        next();
      }
    });
  },
  //Check db for url, if is in db return results, if not next
  function (req, res, next) {
    urlModel.findOne({ url: req.body.url }, function (err, data) {
      if (err) {
        return console.error(err);
      } else if (data != null) {
        res.json({ original_url: data.url, short_url: data.__v });
      } else {
        next();
      }
    });
  },
  // Increase counter by one and store at res.locals.counter
  function (req, res, next) {
    /*
    let testCounter = new counterModel({ _id: 'urlCounter', seq: 0 });
    testCounter.save(function (err, data) {
      if (err) return console.error(err);
      console.log(data);
    });
*/
    counterModel.findByIdAndUpdate(
      { _id: 'urlCounter' },
      { $inc: { seq: 1 } },
      function (err, data) {
        if (err) {
          return console.error(err);
        } else {
          res.locals.counter = data.seq + 1;
          next();
        }
      }
    );
  },
  //Insert missing entry into db
  function (req, res, next) {
    let newUrl = new urlModel({ url: req.body.url, seqId: res.locals.counter });
    newUrl.save(function (err, data) {
      if (err) {
        return console.error(err);
      } else {
        res.json({ original_url: data.url, short_url: data.seqId });
      }
    });
  }
);

app.get('/api/shorturl/:seqNum', function (req, res, next) {
  console.log('test');
  urlModel.findOne({ seqId: req.params.seqNum }, function (err, data) {
    if (err) {
      return console.error(err);
    } else {
      res.redirect(data.url);
    }
  });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
