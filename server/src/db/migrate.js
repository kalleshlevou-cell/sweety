const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

// Import models to ensure indexes are created
require('../models/User');
require('../models/Reading');

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, { dbName: 'sweety' });
    console.log('Connected to MongoDB');

    // Mongoose automatically creates indexes defined in schemas
    // This script ensures they are synced
    await mongoose.model('User').ensureIndexes();
    await mongoose.model('Reading').ensureIndexes();

    console.log('✅ Migration completed: Indexes synced successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
};

migrate();
