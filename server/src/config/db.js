const mongoose = require('mongoose');
const env = require('./env');

async function connectDatabase() {
  if (!env.mongoUri) {
    throw new Error('MONGODB_URI is required');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 5000
  });
}

module.exports = connectDatabase;
