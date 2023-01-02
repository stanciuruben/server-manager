const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { addToWriteFile } = require('../queues/writeFile');
const serverResponses = require('../messages/resoponses.json');

// @route   POST
// @desc    Add new job to Write Files Queue
// @access  Private
router.post('/', auth, (req, res) => {
   const resLanguage = req.body.lang ?? 'en';
   try {
      addToWriteFile({
         client: req.body.client,
         path: req.body.path,
         blob: req.body.blob
      });
      res.json({ status: 200, message: serverResponses[resLanguage]['job-queued'] });
   } catch (error) {
      res.json({ status: 500, message: error.message });
   }
});

module.exports = router;
