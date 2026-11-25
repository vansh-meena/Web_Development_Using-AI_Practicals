require('dotenv').config();
const { connectDb, disconnectDb } = require('../config/db');
const { seedProducts } = require('./products');

async function run() {
  await connectDb(process.env.MONGODB_URI || '');
  const count = await seedProducts();
  console.log(`Seed complete: ${count} products written (collection cleared first).`);
  await disconnectDb();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
