const mongoose = require('mongoose');

const CATEGORIES = ['electronics', 'apparel', 'books', 'home'];

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'name is required'],
      trim: true,
      maxlength: [120, 'name must be at most 120 characters'],
      unique: true,
    },
    description: {
      type: String,
      default: '',
      maxlength: [2000, 'description must be at most 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'category is required'],
      enum: {
        values: CATEGORIES,
        message: 'category must be one of: ' + CATEGORIES.join(', '),
      },
    },
    price: {
      type: Number,
      required: [true, 'price is required'],
      min: [0, 'price must be >= 0'],
    },
    quantity: {
      type: Number,
      default: 0,
      min: [0, 'quantity must be >= 0'],
      validate: {
        validator: Number.isInteger,
        message: 'quantity must be an integer',
      },
    },
    inStock: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
module.exports.CATEGORIES = CATEGORIES;
