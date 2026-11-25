require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const tasksRouter = require('./src/routes/tasks');
const { connectDatabase } = require('./src/config/db');
const { errorHandler } = require('./src/middleware/errorHandler');

const app = express();
const port = Number(process.env.PORT) || 5003;
let memoryServer;
let httpServer;

app.use(cors());
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    experiment: 'task-manager-crud',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});
app.use('/api/tasks', tasksRouter);
app.use('/api', (req, res) => {
  res.status(404).json({ error: { message: 'API route not found', details: {} } });
});
app.use(errorHandler);

async function start() {
  const database = await connectDatabase();
  memoryServer = database.memoryServer;
  console.log(`Database: ${database.label}`);
  httpServer = app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
}

async function shutdown(signal) {
  console.log(`Received ${signal}; shutting down cleanly.`);
  if (httpServer) {
    await new Promise((resolve) => httpServer.close(resolve));
  }
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
  process.exit(0);
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

start().catch((error) => {
  console.error('Unable to start the API.', error);
  process.exit(1);
});
