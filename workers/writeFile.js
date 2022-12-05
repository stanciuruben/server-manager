const { Worker } = require('bullmq');
const fs = require('fs');
const config = require('config');

const workerHandler = async job => {
   try {
      const path = `../public-testing/${job.data.client}/${job.data.path}`;
      fs.writeFileSync(path, job.data.blob);
   } catch (error) {
      console.error('\x1b[37m', error.message);
      // store errors in redis
   }
};

const redisOptions = config.get('redisOptions');
/* eslint-disable no-unused-vars */
const worker = new Worker('writeFile', workerHandler, { connection: redisOptions });
console.log('\x1b[35m', 'writeFile worker started');

module.exports = worker;
