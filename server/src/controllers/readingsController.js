const { validationResult } = require('express-validator');
const Reading = require('../models/Reading');

const SLOT_LABELS = {
  morning_fasting: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

/**
 * Helper: normalize a date string to midnight UTC
 */
const toDateOnly = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00.000Z');
  return d;
};

/**
 * Create a new reading
 * POST /api/readings
 */
const createReading = async (req, res) => {
  try {
    // Check validation errors from express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { date, time_slot, value } = req.body;
    const userId = req.user.id;
    const readingDate = toDateOnly(date);

    // Check if reading already exists for this slot and date
    const existingSlot = await Reading.findOne({
      user: userId,
      date: readingDate,
      time_slot,
    });
    if (existingSlot) {
      return res.status(409).json({
        error: `You already have an ${SLOT_LABELS[time_slot]} reading for this date.`,
      });
    }

    // Check max 4 readings per day
    const dayCount = await Reading.countDocuments({
      user: userId,
      date: readingDate,
    });
    if (dayCount >= 4) {
      return res.status(409).json({ error: 'You can add only 4 readings per day.' });
    }

    // Create reading
    const reading = await Reading.create({
      user: userId,
      date: readingDate,
      time_slot,
      value: parseInt(value),
    });

    res.status(201).json({
      message: 'Reading added successfully.',
      reading,
    });
  } catch (err) {
    console.error('Create reading error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * Get all readings for the authenticated user
 * GET /api/readings?page=1&limit=20&date=2026-10-15
 */
const getReadings = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { user: userId };

    // Optional date filter
    if (req.query.date) {
      filter.date = toDateOnly(req.query.date);
    }

    const [readings, total] = await Promise.all([
      Reading.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Reading.countDocuments(filter),
    ]);

    res.json({
      readings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Get readings error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * Get a single reading
 * GET /api/readings/:id
 */
const getReading = async (req, res) => {
  try {
    const reading = await Reading.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!reading) {
      return res.status(404).json({ error: 'Reading not found.' });
    }
    res.json({ reading });
  } catch (err) {
    console.error('Get reading error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * Update a reading
 * PUT /api/readings/:id
 */
const updateReading = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { id } = req.params;
    const userId = req.user.id;

    // Check reading exists and belongs to user
    const existing = await Reading.findOne({ _id: id, user: userId });
    if (!existing) {
      return res.status(404).json({ error: 'Reading not found.' });
    }

    const { date, time_slot, value } = req.body;
    const newDate = date ? toDateOnly(date) : existing.date;
    const newSlot = time_slot || existing.time_slot;
    const newValue = value !== undefined ? parseInt(value) : existing.value;

    // If date or slot changed, check for duplicates
    if (date || time_slot) {
      const duplicate = await Reading.findOne({
        user: userId,
        date: newDate,
        time_slot: newSlot,
        _id: { $ne: id },
      });
      if (duplicate) {
        return res.status(409).json({
          error: `You already have an ${SLOT_LABELS[newSlot]} reading for this date.`,
        });
      }
    }

    existing.date = newDate;
    existing.time_slot = newSlot;
    existing.value = newValue;
    await existing.save();

    res.json({
      message: 'Reading updated successfully.',
      reading: existing,
    });
  } catch (err) {
    console.error('Update reading error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * Delete a reading
 * DELETE /api/readings/:id
 */
const deleteReading = async (req, res) => {
  try {
    const reading = await Reading.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!reading) {
      return res.status(404).json({ error: 'Reading not found.' });
    }
    res.json({ message: 'Reading deleted successfully.' });
  } catch (err) {
    console.error('Delete reading error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { createReading, getReadings, getReading, updateReading, deleteReading };
