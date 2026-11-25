require('dotenv').config();
const app = require('./src/app');
const { connectDb } = require('./src/config/db');
const Product = require('./src/models/Product');
const { seedProducts } = require('./src/seed/products');

const PORT = process.env.PORT || 4007;
const MONGODB_URI = process.env.MONGODB_URI || '';

async function start() {
  try {
    await connectDb(MONGODB_URI);

    if (!MONGODB_URI) {
      console.warn('==========================================================');
      console.warn('  WARNING: MONGODB_URI not set.');
      console.warn('  Running with an in-memory MongoDB.');
      console.warn('  All data is TEMPORARY and will be lost on shutdown.');
      console.warn('==========================================================');
    }

    const count = await Product.estimatedDocumentCount();
    if (count === 0 && (!MONGODB_URI || process.env.SEED_ON_EMPTY === 'true')) {
      await seedProducts();
      console.log('Seeded sample products (collection was empty).');
    }

    app.listen(PORT, () => {
      console.log(`Product catalogue API listening on http://localhost:${PORT}`);
      console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
