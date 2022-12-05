const jwt = require('jsonwebtoken');
const config = require('config');
const serverResponses = require('../messages/responses.json');

module.exports = (req, res, next) => {
   const resLanguage = req.body.lang ?? 'en';
   const token = req.cookies[req.body.client + '-auth-token'];

   try {
      if (!token) { throw new Error('no token'); }
      const decoded = jwt.verify(token, config.get('jwtSecret'));
      if (decoded) {
         next();
      }
   } catch (err) {
      res.status(401).json({ status: 401, message: serverResponses[resLanguage]['token-invalid'] });
   }
};
