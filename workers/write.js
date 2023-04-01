const { Worker } = require('bullmq');
const config = require('config');
const redisOptions = config.get('redisOptions');

const workerHandler = async job => {
   try {
      console.log(job);
   } catch (error) {
      console.error('\x1b[37m', error.message);
      // store errors in redis
   }
};

/* eslint-disable no-unused-vars */
const worker = new Worker('write', workerHandler, { connection: redisOptions });
console.log('\x1b[35m', 'Write worker started');

module.exports = worker;
