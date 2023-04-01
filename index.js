// Start Queues
// const writeQueue = require('./queues/write');

// Start Workers
// const writeWorker = require('./workers/write');

// Express Setup
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');

app.use(express.json({ extended: false }));
app.use(cookieParser());

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/logout', require('./routes/logout'));
app.use('/errors', require('./routes/errors'));

const PORT = 9999;
const server = app.listen(PORT, function () {
   const host = server.address().address;
   const port = server.address().port;
   console.log('\x1b[36m', `Listening at http://${host}${port}`);
   console.log('\x1b[0m', '');
});

module.exports = { app, server /* , writeQueue, writeWorker */ };
