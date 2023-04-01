const jwt = require('jsonwebtoken');
const config = require('config');
const serverResponses = require('../messages/responses.json');
const getTimeString = require('../services/getTimeString');
const Redis = require('ioredis');

module.exports = async (req, res, next) => {
   const resLanguage = req.body.lang in serverResponses ? req.body.lang : 'en';
   const token = req.cookies[req.body.client + '-auth-token'];
   const redis = new Redis({
      host: 'localhost',
      port: 6379,
      db: 1
   });

   try {
      if (!token) { throw new Error(serverResponses[resLanguage]['invalid-request']); }
      const validTokens = await redis.zrangebyscore(`clients:${req.body.client}:valid-tokens`, getTimeString('-1h'), '+inf');
      await redis.quit();
      const isTokenInDatabase = validTokens.includes(token);
      if (isTokenInDatabase) {
         const isTokenValid = await jwt.verify(token, config.get('jwtSecret'));
         if (isTokenValid) {
            return next();
         }
         throw new Error(serverResponses[resLanguage]['token-invalid']);
      }
      throw new Error(serverResponses[resLanguage]['token-invalid']);
   } catch (err) {
      return res.status(401).json({ status: 401, message: err.message });
   }
};
