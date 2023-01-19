const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const checkToken = require('../middlewares/check-token');
const serverResponses = require('../messages/responses.json');
const Redis = require('ioredis');
const getTimeSting = require('../services/getTimeString');

// @route   GET /new
// @desc    Returns unread errors from given client or error message
// @access  Pivate - Server Admin Only
router.get('/:clientName/new',
   param('clientName').not().isEmpty().trim().escape(),
   body('lang').not().isEmpty().trim().escape(),
   body('client').not().isEmpty().trim().escape(),
   checkToken,
   async (req, res) => {
      const resLanguage = req.body.lang in serverResponses ? req.body.lang : 'en';
      if (req.body.client === 'serverAdmin') {
         const redis = new Redis({
            host: 'localhost',
            port: 6379,
            db: 1
         });
         try {
            const unreadErrorIds = await redis.zrangebyscore(`errors:${req.params.clientName}:unread`, '-inf', '+inf') ?? [];
            const unreadErrors = new Array(unreadErrorIds.length);
            for (let i = 0; i < unreadErrorIds.length; i++) {
               const id = unreadErrorIds[i];
               unreadErrors[i] = JSON.parse(await redis.call('JSON.GET', `errors:${req.params.clientName}#${id}`));
               typeof unreadErrors[i] === 'object' ?? (unreadErrors[i].id = id);
            }
            redis.quit();
            return res.status(200).json({
               status: 200,
               message: serverResponses[resLanguage]['items-found'] + unreadErrors.length,
               lang: resLanguage,
               data: unreadErrors
            });
         } catch (error) {
            redis.quit();
            return res.status(400).json({
               status: 400,
               lang: resLanguage,
               message: serverResponses[resLanguage]['access-denied'],
               err: error.message
            });
         }
      }
      return res.status(401).json({
         status: 401,
         lang: resLanguage,
         message: serverResponses[resLanguage]['access-denied']
      });
   });

// @route   DELETE /new
// @desc    Given client name and error id delete error from unread
// @desc    errors form database and save it into read errors
// @desc    retruns successful response or error
// @access  Pivate - Server Admin Only
router.delete('/:clientName/new',
   param('clientName').not().isEmpty().trim().escape(),
   body('lang').not().isEmpty().trim().escape(),
   body('client').not().isEmpty().trim().escape(),
   checkToken,
   async (req, res) => {
      const resLanguage = req.body.lang in serverResponses ? req.body.lang : 'en';
      if (req.body.client === 'serverAdmin') {
         const redis = new Redis({
            host: 'localhost',
            port: 6379,
            db: 1
         });
         const id = req.body.id;
         try {
            const isRemovedFromUnread = await redis.zrem(`errors:${req.params.clientName}:unread`, id);
            if (!isRemovedFromUnread) {
               throw new Error(`Id not found in unread set of ${req.params.clientName} client.`);
            }
            const readTime = getTimeSting();
            await redis.zadd(`errors:${req.params.clientName}:read`, readTime, id);
            await redis.call('JSON.SET', `errors:${req.params.clientName}#${id}`, '$.read', readTime);
            redis.quit();
            return res.status(200).json({
               status: 200,
               lang: resLanguage,
               id
            });
         } catch (error) {
            redis.quit();
            return res.status(400).json({
               status: 400,
               lang: resLanguage,
               message: serverResponses[resLanguage]['access-denied'],
               err: error.message
            });
         }
      }
      return res.status(401).json({
         status: 401,
         lang: resLanguage,
         message: serverResponses[resLanguage]['access-denied']
      });
   });

// @route   GET /old
// @desc    Returns read errors from given client or error
// @access  Pivate - Server Admin Only
router.get('/:clientName/old',
   param('clientName').not().isEmpty().trim().escape(),
   body('lang').not().isEmpty().trim().escape(),
   body('client').not().isEmpty().trim().escape(),
   checkToken,
   async (req, res) => {
      const resLanguage = req.body.lang in serverResponses ? req.body.lang : 'en';
      if (req.body.client === 'serverAdmin') {
         const redis = new Redis({
            host: 'localhost',
            port: 6379,
            db: 1
         });
         try {
            const readErrorIds = await redis.zrangebyscore(`errors:${req.params.clientName}:read`, '-inf', '+inf') ?? [];
            const readErrors = new Array(readErrorIds.length);
            for (let i = 0; i < readErrorIds.length; i++) {
               const id = readErrorIds[i];
               readErrors[i] = JSON.parse(await redis.call('JSON.GET', `errors:${req.params.clientName}#${id}`));
               typeof readErrors[i] === 'object' ?? (readErrors[i].id = id);
            }
            redis.quit();
            return res.status(200).json({
               status: 200,
               message: serverResponses[resLanguage]['items-found'] + readErrors.length,
               lang: resLanguage,
               data: readErrors
            });
         } catch (error) {
            redis.quit();
            return res.status(400).json({
               status: 400,
               lang: resLanguage,
               message: serverResponses[resLanguage]['access-denied'],
               err: error.message
            });
         }
      }
      return res.status(401).json({
         status: 401,
         lang: resLanguage,
         message: serverResponses[resLanguage]['access-denied']
      });
   });

module.exports = router;
