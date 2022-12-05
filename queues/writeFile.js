const { Queue } = require('bullmq');
const config = require('config');
const redisOptions = config.get('redisOptions');
const queue = new Queue('writeFile', { connection: redisOptions });

module.exports = queue;

module.exports.addToWriteFile = (data) => {
   queue.add('writeFile', data);
};

console.log('\x1b[35m', 'writeFile queue started');
