const mongoose = require('mongoose');

const VALID_SLOTS = ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner'];

const readingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  time_slot: {
    type: String,
    required: [true, 'Time slot is required'],
    enum: {
      values: VALID_SLOTS,
      message: 'Time slot must be one of: morning_fasting, after_breakfast, after_lunch, after_dinner',
    },
  },
  value: {
    type: Number,
    required: [true, 'Glucose value is required'],
    min: [40, 'Value must be between 40 and 600 mg/dl.'],
    max: [600, 'Value must be between 40 and 600 mg/dl.'],
    validate: {
      validator: Number.isInteger,
      message: 'Value must be a whole number.',
    },
  },
}, {
  timestamps: true,
});

// Compound index: one reading per slot per day per user
readingSchema.index({ user: 1, date: 1, time_slot: 1 }, { unique: true });

// Index for faster queries by user and date
readingSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Reading', readingSchema);

