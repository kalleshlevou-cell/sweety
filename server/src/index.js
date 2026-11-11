const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const readingsRoutes = require('./routes/readings');
const reportsRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/readings', readingsRoutes);
app.use('/api/reports', reportsRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// Auto-seed helper for in-memory mode
const autoSeed = async () => {
  const User = require('./models/User');
  const Reading = require('./models/Reading');

  const existingUser = await User.findOne({ email: 'demo@sweety.com' });
  if (existingUser) return; // Already seeded

  console.log('🌱 Auto-seeding demo data...');
  const user = await User.create({
    name: 'Demo User',
    email: 'demo@sweety.com',
    password: 'Demo@123',
  });

  const slots = ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner'];
  const today = new Date();
  const readings = [];

  for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    const readingDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

    const numReadings = Math.floor(Math.random() * 3) + 2;
    const shuffledSlots = [...slots].sort(() => Math.random() - 0.5);

    for (let i = 0; i < numReadings; i++) {
      let baseValue;
      switch (shuffledSlots[i]) {
        case 'morning_fasting': baseValue = 95 + Math.floor(Math.random() * 40); break;
        case 'after_breakfast': baseValue = 130 + Math.floor(Math.random() * 50); break;
        case 'after_lunch': baseValue = 120 + Math.floor(Math.random() * 60); break;
        case 'after_dinner': baseValue = 110 + Math.floor(Math.random() * 50); break;
        default: baseValue = 100;
      }
      readings.push({
        user: user._id,
        date: readingDate,
        time_slot: shuffledSlots[i],
        value: baseValue,
      });
    }
  }

  await Reading.insertMany(readings);
  console.log(`✅ Seeded demo user (demo@sweety.com / Demo@123) with ${readings.length} readings\n`);
};

// Start server (only if not in test mode)
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(async () => {
    // Auto-seed if database is empty (useful for in-memory mode)
    await autoSeed();
    app.listen(PORT, () => {
      console.log(`🩸 Sweety API running on http://localhost:${PORT}`);
    });
  });
}

module.exports = app;
