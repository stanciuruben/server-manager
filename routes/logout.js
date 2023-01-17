const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const serverResponses = require('../messages/responses.json');
const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');
const getTimeString = require('../services/getTimeString');

// @route   POST
// @desc    Get client name and token and remove token form db
// @desc    In case of invalid request saves the error in the database
// @access  Public
router.post('/',
   body('client').not().isEmpty().trim().escape(),
   async (req, res) => {
      const resLanguage = req.body.lang in serverResponses ? req.body.lang : 'en';
      const redis = new Redis({
         host: 'localhost',
         port: 6379,
         db: 1
      });
      // Get clients form db
      const client = req.body.client;
      const token = req.cookies[`${client}-auth-token`];
      const clients = await redis.lrange('clients', 0, -1);
      const isClientValid = clients.includes(client);
      // If client exists remove the token form valid-tokens list
      if (token && isClientValid) {
         await redis.zrem(`clients:${client}:valid-tokens`, token);
         return res.status(200).json({
            status: 200,
            lang: resLanguage,
            message: serverResponses[resLanguage]['logout-successful']
         });
      }
      // Report invalid request
      const errorId = uuidv4();
      const errorTime = getTimeString();
      const errorObject = {
         date: errorTime,
         error: serverResponses.en['invalid-request'],
         client,
         req: req.body
      };
      await redis.zadd(`errors:${client}:unread`, [errorTime, errorId]);
      await redis.call('JSON.SET', `errors:${client}#${errorId}`, '$', JSON.stringify(errorObject));
      res.status(400).json({
         status: 400,
         lang: resLanguage,
         message: serverResponses[resLanguage]['invalid-request']
      });
      redis.quit();
   });

module.exports = router;
