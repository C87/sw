#!/usr/bin/env nodejs
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
require('dotenv').config();

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
require('./_db/index.js');
require('./_db/models/user.js');
require('./_db/models/post.js');

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
const router = require('./routes');
const bodyParser = require('body-parser');
const express = require('express');
const helmet = require('helmet');
const nunjucks = require('nunjucks');
const path = require('path');
const session = require('express-session');
const client = require('redis').createClient();
const RedisStore = require('connect-redis')(session);

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
const app = express();
app.use(helmet());

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
client.on('error', (err) => {
  console.log('Redis Error:', err);
});

client.on('connect', () => {
  console.log('Connected to Redis');
});

// -----------------------------------------------------------------------------
// Initalise Session
// -----------------------------------------------------------------------------
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new RedisStore({
    client,
  }),
}));

// -----------------------------------------------------------------------------
// Initalise Body Parser
// -----------------------------------------------------------------------------
app.use(bodyParser.urlencoded({ extended: false }));

// -----------------------------------------------------------------------------
// Serve Static Assets
// -----------------------------------------------------------------------------
app.use(express.static(path.join(`${__dirname}/public`)));

// -----------------------------------------------------------------------------
// Nunjucks Configuration
// -----------------------------------------------------------------------------
nunjucks.configure(path.join(`${__dirname}/views/`), {
  express: app,
});

// -----------------------------------------------------------------------------
// Use Router Middleware
// -----------------------------------------------------------------------------
app.use(router);

// -----------------------------------------------------------------------------
// Error Handling Middleware
// -----------------------------------------------------------------------------
app.use((err, req, res, next) => {
  console.log(err);
  res
    .json({
      code: err.code,
      body: err.message,
    });
});

// -----------------------------------------------------------------------------
// Start Server
// -----------------------------------------------------------------------------
const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`Listening on Port ${port}`);
});

// -----------------------------------------------------------------------------
// Export APP Module. Require in testing directory.
// -----------------------------------------------------------------------------
module.exports.app = app;
