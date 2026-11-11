const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  dailyReport, monthToDateReport, monthlyReport, chartData,
} = require('../controllers/reportsController');

// All report routes require authentication
router.use(auth);

router.get('/daily', dailyReport);
router.get('/month-to-date', monthToDateReport);
router.get('/monthly', monthlyReport);
router.get('/chart', chartData);

module.exports = router;
