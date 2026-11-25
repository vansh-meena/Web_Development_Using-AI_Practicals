const Product = require('../models/Product');

const sampleProducts = [
  {
    name: 'Aurora Wireless Headphones',
    description:
      'Over-ear wireless headphones with active noise cancelling and 30-hour battery life.',
    category: 'electronics',
    price: 189.99,
    quantity: 42,
    inStock: true,
  },
  {
    name: 'Nimbus Mechanical Keyboard',
    description:
      'Tenkeyless mechanical keyboard with hot-swappable switches and per-key RGB lighting.',
    category: 'electronics',
    price: 129.5,
    quantity: 15,
    inStock: true,
  },
  {
    name: 'Cedar Ridge Trail Jacket',
    description:
      'Water-resistant hiking jacket with sealed seams and adjustable hood. Currently sold out.',
    category: 'apparel',
    price: 94.0,
    quantity: 0,
    inStock: false,
  },
  {
    name: 'Harbor Merino Sweater',
    description:
      'Lightweight merino wool crewneck sweater, breathable and machine washable.',
    category: 'apparel',
    price: 79.95,
    quantity: 27,
    inStock: true,
  },
  {
    name: 'The Silent Cartographer',
    description:
      'A fantasy novel about a mapmaker who charts lands that vanish from memory overnight.',
    category: 'books',
    price: 18.99,
    quantity: 120,
    inStock: true,
  },
  {
    name: 'Foundations of Quiet Cooking',
    description:
      'A cookbook of 60 slow, deliberate recipes for small kitchens and long evenings.',
    category: 'books',
    price: 32.0,
    quantity: 8,
    inStock: true,
  },
  {
    name: 'Kiln Stoneware Mug Set',
    description:
      'Set of four hand-thrown stoneware mugs with a speckled matte glaze, dishwasher safe.',
    category: 'home',
    price: 46.25,
    quantity: 64,
    inStock: true,
  },
  {
    name: 'Solace Linen Duvet Cover',
    description:
      'Stonewashed linen duvet cover in warm sand, naturally temperature regulating.',
    category: 'home',
    price: 135.0,
    quantity: 12,
    inStock: true,
  },
];

async function seedProducts() {
  await Product.deleteMany({});
  await Product.insertMany(sampleProducts);
  return sampleProducts.length;
}

module.exports = { seedProducts, sampleProducts };
