require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const { Schema } = mongoose;

const urlShortScehma = new Schema({
  original_url: String,
  short_url: Number,
});

let UrlShort = mongoose.model('urlShort', urlShortScehma);

const express = require('express');
const cors = require('cors');
const app = express();
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', async function (req, res) {
  let inputUrl = req.body.url;

  let urlRegex = new RegExp(/(?<=(http|https):\/\/)[^\/]+/); // fragment locator
  
  if(!inputUrl.match(urlRegex)){
    res.json({error: 'Invalid URL'})
    return
  }

  // let rawdata = fs.readFileSync(path.resolve(__dirname, 'data.json'));
  // let data = JSON.parse(rawdata);
  
  // Cek kalau datanya sudah ada.
  let found = await UrlShort.find({ original_url: req.body.url})

  if (found.length > 0) {
    res.json(found);
  } else {
    let last_id = await UrlShort.find({}).sort({short_url: -1}).limit(1)
    
    if (last_id.length === 0) {
      last_id = 0;
    } else {
      last_id = last_id[0].short_url
    }
    
    let output = {
      original_url: req.body.url,
      short_url: last_id + 1,
    };

    await UrlShort.create(output);

    res.json(output);
  }
});

// Your first API endpoint
app.get('/api/shorturl/:short_url', function (req, res) {
  const { short_url } = req.params;
  let rawdata = fs.readFileSync('data.json');
  let data = JSON.parse(rawdata);
  let found = data.find((item) => item.short_url === parseInt(short_url));

  if (found) {
    res.redirect(found.original_url);
  } else {
    res.status = '404'
    res.json({
      error: "No short URL found for the given input"
    })
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
