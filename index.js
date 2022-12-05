// Start Queues
require('./queues/writeFile');

// Start Workers
require('./workers/writeFile');

// Express Setup
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');

app.use(express.json({ extended: false }));
app.use(cookieParser());

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/writeFile', require('./routes/writeFile'));

const PORT = 9999;
const server = app.listen(PORT, function () {
   const host = server.address().address;
   const port = server.address().port;
   console.log('\x1b[35m', `Listening at http://${host}${port}`);
});
