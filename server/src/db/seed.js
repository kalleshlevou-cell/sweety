const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const User = require('../models/User');
const Reading = require('../models/Reading');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, { dbName: 'sweety' });
    console.log('Connected to MongoDB');

    // Clean existing data
    await Reading.deleteMany({});
    await User.deleteMany({});

    // Create demo user (password hashed by pre-save hook)
    const user = await User.create({
      name: 'Demo User',
      email: 'demo@sweety.com',
      password: 'Demo@123',
    });

    // Generate sample readings for the past 30 days
    const slots = ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner'];
    const today = new Date();
    const readings = [];

    for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      // Normalize to midnight UTC
      const readingDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

      // Add 2-4 readings per day
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

    console.log(`✅ Seed completed: Created demo user (demo@sweety.com / Demo@123) with ${readings.length} readings`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
