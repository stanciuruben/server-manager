const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const config = require('config');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const serverResponses = require('../messages/resoponses.json');

// @route   POST
// @desc    Get lang, client, user and password => return token
// @access  Public
router.post(
   '/',
   body('lang').not().isEmpty().trim().escape(),
   body('client').not().isEmpty().trim().escape(),
   body('username').not().isEmpty().trim().escape(),
   body('password').not().isEmpty().trim().escape(),
   async (req, res) => {
      const resLanguage = req.body.lang in serverResponses ? req.body.lang : 'en';
      try {
         const usernameHash = config.get(req.body.client + '.username') || '';
         const passwordHash = config.get(req.body.client + '.password') || '';
         const isUsernameValid = bcrypt.compareSync(req.body.username, usernameHash);
         const isPasswordValid = bcrypt.compareSync(req.body.password, passwordHash);
         if (isUsernameValid && isPasswordValid) {
            const token = await jwt.sign(
               { client: req.body.client, lang: req.body.lang, user: req.body.username },
               config.get('jwtSecret'),
               { expiresIn: '1h' }
            );
            res.status(200).json({
               status: 200,
               lang: resLanguage,
               message: serverResponses[resLanguage]['authentication-successful'],
               token
            });
         } else {
            res.status(400).json({
               status: 400,
               lang: resLanguage,
               message: serverResponses[resLanguage]['authentication-unauthorized']
            });
         }
      } catch (err) {
         res.status(400).json({
            status: 400,
            lang: resLanguage,
            message: serverResponses[resLanguage]['authentication-failed'],
            err: err.message
         });
      }
   });

module.exports = router;
