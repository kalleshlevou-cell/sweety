const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createReading, getReadings, getReading, updateReading, deleteReading,
} = require('../controllers/readingsController');
const {
  createReadingValidation, updateReadingValidation,
} = require('../validators/readingValidator');

// All reading routes require authentication
router.use(auth);

router.post('/', createReadingValidation, createReading);
router.get('/', getReadings);
router.get('/:id', getReading);
router.put('/:id', updateReadingValidation, updateReading);
router.delete('/:id', deleteReading);

module.exports = router;
