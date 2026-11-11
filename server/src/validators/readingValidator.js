const { body, param, query } = require('express-validator');

/**
 * Validation rules for blood glucose readings
 */
const VALID_SLOTS = ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner'];

const createReadingValidation = [
  body('date')
    .notEmpty().withMessage('Date is required.')
    .isISO8601().withMessage('Date must be a valid date.')
    .custom((value) => {
      const inputDate = new Date(value + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (inputDate > today) {
        throw new Error('Date cannot be in the future.');
      }
      return true;
    }),

  body('time_slot')
    .notEmpty().withMessage('Time slot is required.')
    .isIn(VALID_SLOTS).withMessage(`Time slot must be one of: ${VALID_SLOTS.join(', ')}.`),

  body('value')
    .notEmpty().withMessage('Please enter a glucose value.')
    .isInt({ min: 40, max: 600 }).withMessage('Value must be between 40 and 600 mg/dl.'),
];

const updateReadingValidation = [
  body('value')
    .optional()
    .notEmpty().withMessage('Please enter a glucose value.')
    .isInt({ min: 40, max: 600 }).withMessage('Value must be between 40 and 600 mg/dl.'),

  body('date')
    .optional()
    .isISO8601().withMessage('Date must be a valid date.')
    .custom((value) => {
      const inputDate = new Date(value + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (inputDate > today) {
        throw new Error('Date cannot be in the future.');
      }
      return true;
    }),

  body('time_slot')
    .optional()
    .isIn(VALID_SLOTS).withMessage(`Time slot must be one of: ${VALID_SLOTS.join(', ')}.`),
];

module.exports = {
  createReadingValidation,
  updateReadingValidation,
  VALID_SLOTS,
};
