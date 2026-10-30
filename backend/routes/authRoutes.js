/**
 * authRoutes.js — /api/auth endpoints
 */
const express    = require('express');
const router     = express.Router();
const { protect }           = require('../middleware/authMiddleware');
const { register, login, getMe, updateProfile } = require('../controllers/authController');

router.post('/register', register);
router.post('/login',    login);
router.get('/me',        protect, getMe);
router.put('/profile',   protect, updateProfile);

module.exports = router;
