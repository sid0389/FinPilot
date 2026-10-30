/**
 * financeRoutes.js — /api/finance endpoints (all protected)
 */
const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getProfile,
  updateProfile,
  saveRiskScore,
  saveRecommendation,
  resetProfile,
} = require('../controllers/financeController');

// All routes require authentication
router.use(protect);

router.get('/',                  getProfile);
router.put('/',                  updateProfile);
router.post('/risk',             saveRiskScore);
router.post('/recommendation',   saveRecommendation);
router.delete('/reset',          resetProfile);

module.exports = router;
