const jwt = require('jsonwebtoken');
const config = require('config');
const serverResponses = require('../messages/resoponses.json');
const bcrypt = require('bcrypt');

module.exports = (req, res, next) => {
   const resLanguage = req.body.lang in serverResponses ? req.body.lang : 'en';
   const token = req.cookies[req.body.client + '-auth-token'];

   try {
      if (!token) { throw new Error('no token'); }
      jwt.verify(token, config.get('jwtSecret'), (_error, decodedToken) => {
         if (config.has(decodedToken.client) && decodedToken.client === req.body.client) {
            const usernameHash = config.get(decodedToken.client + '.username') || '';
            if (bcrypt.compareSync(decodedToken.user, usernameHash)) {
               next();
            }
         }
      });
   } catch (err) {
      res.status(401).json({ status: 401, message: serverResponses[resLanguage]['token-invalid'] });
   }
};
