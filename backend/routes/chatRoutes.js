/**
 * chatRoutes.js — AI chatbot proxy (keeps API key server-side)
 */
const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { chat }    = require('../controllers/chatController');

router.post('/', protect, chat);

module.exports = router;
