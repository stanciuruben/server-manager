const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');

app.use(express.json({ extended: false }));
app.use(cookieParser());
// Static Folder
app.use(express.static('public'));

// Routes
app.use('/auth', require('./routes/auth'));

const PORT = 9999;
const server = app.listen(PORT, function () {
   const host = server.address().address;
   const port = server.address().port;
   console.log('Listening at http://', host, port);
});
