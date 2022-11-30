const express = require('express');
const app = express();

app.get('/', function (req, res) {
   res.send('Hello World');
})
const PORT = 9999;
const server = app.listen(PORT, function () {
   const host = server.address().address
   const port = server.address().port
   
   console.log("Example app listening at http://%s:%s", host, port)
})