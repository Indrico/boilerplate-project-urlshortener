require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const { resolve } = require('path');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', function (req, res) {
  let inputUrl = req.body.url;

  let urlRegex = new RegExp(/(?<=(http|https):\/\/)[^\/]+/); // fragment locator
  
  if(!inputUrl.match(urlRegex)){
    res.json({error: 'Invalid URL'})
    return
  }

  let rawdata = fs.readFileSync(path.resolve(__dirname, 'data.json'));
  let data = JSON.parse(rawdata);
  // Cek kalau datanya sudah ada.
  let found = data.find((item) => item.original_url === req.body.url);
  if (found) {
    res.json(found);
  } else {
    let last_id = data.reduce(
      (acc, value) => (acc = acc > value.short_url ? acc : value.short_url),
      0
    );

    let output = {
      original_url: req.body.url,
      short_url: last_id + 1,
    };

    // Push data baru ke data keseluruhan
    data.push(output);

    // Tulis data baru
    fs.writeFileSync(
      path.resolve(__dirname, 'data.json'),
      JSON.stringify(data)
    );

    res.json(output);
  }
});

// Your first API endpoint
app.get('/api/shorturl/:short_url', function (req, res) {
  const { short_url } = req.params;
  let rawdata = fs.readFileSync('data.json');
  let data = JSON.parse(rawdata);
  let found = data.find((item) => item.short_url === parseInt(short_url));

  res.redirect(found.original_url);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
