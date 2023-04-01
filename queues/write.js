const { Queue } = require('bullmq');
const config = require('config');
const redisOptions = config.get('redisOptions');
const queue = new Queue('write', { connection: redisOptions });

module.exports = queue;

module.exports.addToWrite = (data) => {
   queue.add('write', data);
};

console.log('\x1b[35m', 'Write queue started');
