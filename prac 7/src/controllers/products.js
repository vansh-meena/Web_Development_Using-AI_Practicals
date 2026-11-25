const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const escapeRegex = require('../utils/escapeRegex');

const CATEGORIES = ['electronics', 'apparel', 'books', 'home'];
const SORT_FIELDS = ['name', 'price', 'quantity', 'createdAt', 'updatedAt'];
const ALLOWED_FIELDS = ['name', 'description', 'category', 'price', 'quantity', 'inStock'];
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function pickAllowed(body) {
  const out = {};
  for (const key of ALLOWED_FIELDS) {
    if (body && Object.prototype.hasOwnProperty.call(body, key)) {
      out[key] = body[key];
    }
  }
  return out;
}

function parseInt_(value, fallback) {
  if (value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isInteger(n) ? n : NaN;
}

const list = asyncHandler(async (req, res) => {
  const { category, inStock, search } = req.query;

  if (category !== undefined && !CATEGORIES.includes(category)) {
    return res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: 'Validation failed',
        details: [
          {
            field: 'category',
            message: `category must be one of: ${CATEGORIES.join(', ')}`,
          },
        ],
      },
    });
  }

  if (inStock !== undefined && inStock !== 'true' && inStock !== 'false') {
    return res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: 'Validation failed',
        details: [
          {
            field: 'inStock',
            message: 'inStock accepts only "true" or "false"',
          },
        ],
      },
    });
  }

  const page = parseInt_(req.query.page, 1);
  if (Number.isNaN(page) || page < 1) {
    return res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: 'Validation failed',
        details: [{ field: 'page', message: 'page must be a positive integer' }],
      },
    });
  }

  const limit = parseInt_(req.query.limit, DEFAULT_LIMIT);
  if (Number.isNaN(limit) || limit < 1) {
    return res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: 'Validation failed',
        details: [{ field: 'limit', message: 'limit must be a positive integer' }],
      },
    });
  }
  const safeLimit = Math.min(limit, MAX_LIMIT);

  let sort = '-createdAt';
  if (req.query.sort !== undefined) {
    const raw = String(req.query.sort);
    const desc = raw.startsWith('-');
    const field = desc ? raw.slice(1) : raw;
    if (!SORT_FIELDS.includes(field)) {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'Validation failed',
          details: [
            {
              field: 'sort',
              message: `sort must be one of: ${SORT_FIELDS.map((f) => (desc ? `-${f}` : f)).join(', ')}`,
            },
          ],
        },
      });
    }
    sort = desc ? `-${field}` : field;
  }

  const filter = {};
  if (category !== undefined) filter.category = category;
  if (inStock !== undefined) filter.inStock = inStock === 'true';
  if (search !== undefined && search !== '') {
    const safe = escapeRegex(search);
    filter.$or = [
      { name: { $regex: safe, $options: 'i' } },
      { description: { $regex: safe, $options: 'i' } },
    ];
  }

  const total = await Product.countDocuments(filter);
  const pages = Math.max(Math.ceil(total / safeLimit), 1);
  const data = await Product.find(filter)
    .sort(sort)
    .skip((page - 1) * safeLimit)
    .limit(safeLimit)
    .lean();

  res.json({
    data,
    meta: { page, limit: safeLimit, total, pages },
  });
});

const getOne = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Product not found' },
    });
  }
  res.json({ data: product });
});

const create = asyncHandler(async (req, res) => {
  const fields = pickAllowed(req.body);
  const product = await Product.create(fields);
  res.status(201).location(`/api/products/${product._id}`).json({ data: product });
});

const replace = asyncHandler(async (req, res) => {
  const fields = pickAllowed(req.body);
  const product = await Product.findOneAndReplace(
    { _id: req.params.id },
    fields,
    { new: true, runValidators: true, upsert: false }
  );
  if (!product) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Product not found' },
    });
  }
  res.json({ data: product });
});

const update = asyncHandler(async (req, res) => {
  const fields = pickAllowed(req.body);
  if (Object.keys(fields).length === 0) {
    return res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: 'Validation failed',
        details: [
          {
            field: 'body',
            message: 'At least one valid field is required',
          },
        ],
      },
    });
  }
  const product = await Product.findByIdAndUpdate(req.params.id, fields, {
    new: true,
    runValidators: true,
  });
  if (!product) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Product not found' },
    });
  }
  res.json({ data: product });
});

const remove = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Product not found' },
    });
  }
  res.status(204).end();
});

module.exports = { list, getOne, create, replace, update, remove };
