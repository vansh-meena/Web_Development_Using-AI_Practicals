const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

async function connectDatabase() {
  if (process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI);
    return { memoryServer: null, label: 'configured MongoDB' };
  }

  const memoryServer = await MongoMemoryServer.create();
  await mongoose.connect(memoryServer.getUri());
  return { memoryServer, label: 'temporary in-memory MongoDB (MONGODB_URI was not set)' };
}

module.exports = { connectDatabase };
