const express = require('express');
const router = express.Router();
const config = require('config');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const escapeChars = require('../services/escapeChars');
const serverResponses = require('../messages/resoponses.json');

// @route   POST
// @desc    Get credentials and return Token
// @access  Public
router.post('/', async (req, res) => {
   const resLanguage = req.body.lang ?? 'en';
   try {
      const reqUsername = escapeChars(req.body.username);
      const reqPassword = escapeChars(req.body.password);
      const usernameHash = config.get(escapeChars(req.body.client) + '.username');
      const passwordHash = config.get(escapeChars(req.body.client) + '.password');
      const isUsernameValid = bcrypt.compareSync(reqUsername, usernameHash);
      const isPasswordValid = bcrypt.compareSync(reqPassword, passwordHash);
      if (isUsernameValid && isPasswordValid) {
         const token = await jwt.sign(
            { admin: true },
            config.get('jwtSecret'),
            { expiresIn: 60 * 60 * 5 } // 5 hours
         );
         res.status(200).json({
            status: 200,
            message: serverResponses[resLanguage]['authentication-successful'],
            token
         });
      } else {
         res.status(401).json({
            status: 401,
            message: serverResponses[resLanguage]['authentication-unauthorized']
         });
      }
   } catch (err) {
      res.status(401).json({
         status: 401,
         message: serverResponses[resLanguage]['authentication-failed'],
         err: err.message
      });
   }
});

module.exports = router;
