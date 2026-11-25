const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer = null;

async function connectDb(uri) {
  if (uri) {
    await mongoose.connect(uri);
    return { mode: 'mongodb' };
  }
  memoryServer = await MongoMemoryServer.create();
  await mongoose.connect(memoryServer.getUri());
  return { mode: 'memory' };
}

async function disconnectDb() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

function dbState() {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
}

module.exports = { connectDb, disconnectDb, dbState };
