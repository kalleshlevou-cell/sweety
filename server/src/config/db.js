const mongoose = require('mongoose');
require('dotenv').config();

let mongoServer = null;

const connectDB = async () => {
  // First try the configured URL
  const configuredUrl = process.env.MONGODB_URL;

  if (configuredUrl && configuredUrl !== 'memory') {
    try {
      await mongoose.connect(configuredUrl, {
        dbName: 'sweety',
        serverSelectionTimeoutMS: 5000,
      });
      console.log('✅ Connected to MongoDB');
      return;
    } catch (err) {
      console.warn(`⚠️  Could not connect to ${configuredUrl}: ${err.message}`);
      console.warn('   Falling back to in-memory MongoDB...\n');
    }
  }

  // Fallback: use mongodb-memory-server (embedded MongoDB)
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    const memoryUrl = mongoServer.getUri();
    await mongoose.connect(memoryUrl, { dbName: 'sweety' });
    console.log('✅ Connected to in-memory MongoDB (data will not persist across restarts)');
    console.log('   💡 To persist data, install MongoDB or use Atlas and set MONGODB_URL in .env\n');
  } catch (err) {
    console.error('❌ Could not start in-memory MongoDB:', err.message);
    console.error('   Install mongodb-memory-server: pnpm add mongodb-memory-server');
    process.exit(1);
  }
};

// Cleanup on exit
const closeDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
};

module.exports = connectDB;
module.exports.closeDB = closeDB;
