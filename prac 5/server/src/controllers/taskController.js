const Task = require('../models/Task');
const { apiError } = require('../middleware/errorHandler');

const writableFields = ['title', 'description', 'priority', 'done'];
const sortFields = new Set(['createdAt', 'updatedAt', 'title', 'priority']);

function getAllowedFields(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw apiError('Request body must be an object', { field: 'body' });
  }
  return writableFields.reduce((fields, field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      fields[field] = body[field];
    }
    return fields;
  }, {});
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parsePositiveInteger(value, fallback, field) {
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw apiError(`${field} must be a positive integer`, { field });
  }
  return parsed;
}

async function listTasks(req, res) {
  const { search, done } = req.query;
  const sort = req.query.sort === undefined ? '-createdAt' : req.query.sort;
  if (done !== undefined && done !== 'true' && done !== 'false') {
    throw apiError('done must be true or false', { field: 'done' });
  }
  if (typeof sort !== 'string') {
    throw apiError('sort is not supported', { field: 'sort' });
  }
  const sortKey = sort.startsWith('-') ? sort.slice(1) : sort;
  if (!sortFields.has(sortKey) || sort.startsWith('--')) {
    throw apiError('sort is not supported', { field: 'sort' });
  }

  const page = parsePositiveInteger(req.query.page, 1, 'page');
  const limit = Math.min(parsePositiveInteger(req.query.limit, 10, 'limit'), 100);
  const filter = {};

  if (search) {
    const safeSearch = escapeRegex(String(search));
    filter.$or = [
      { title: { $regex: safeSearch, $options: 'i' } },
      { description: { $regex: safeSearch, $options: 'i' } }
    ];
  }
  if (done !== undefined) {
    filter.done = done === 'true';
  }

  const [data, total] = await Promise.all([
    Task.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Task.countDocuments(filter)
  ]);

  res.json({ data, page, limit, total, totalPages: Math.ceil(total / limit) });
}

async function getTask(req, res) {
  const task = await Task.findById(req.params.id);
  if (!task) {
    throw apiError('Task not found', {}, 404);
  }
  res.json(task);
}

async function createTask(req, res) {
  const task = await Task.create(getAllowedFields(req.body));
  res.location(`/api/tasks/${task._id}`).status(201).json(task);
}

async function replaceTask(req, res) {
  const task = await Task.findById(req.params.id);
  if (!task) {
    throw apiError('Task not found', {}, 404);
  }

  const fields = getAllowedFields(req.body);
  task.title = fields.title;
  task.description = Object.prototype.hasOwnProperty.call(fields, 'description') ? fields.description : '';
  task.priority = Object.prototype.hasOwnProperty.call(fields, 'priority') ? fields.priority : 'medium';
  task.done = Object.prototype.hasOwnProperty.call(fields, 'done') ? fields.done : false;
  await task.save();
  res.json(task);
}

async function updateTask(req, res) {
  const fields = getAllowedFields(req.body);
  if (Object.keys(fields).length === 0) {
    throw apiError('At least one valid field is required', { fields: writableFields });
  }

  const task = await Task.findByIdAndUpdate(req.params.id, fields, {
    new: true,
    runValidators: true
  });
  if (!task) {
    throw apiError('Task not found', {}, 404);
  }
  res.json(task);
}

async function deleteTask(req, res) {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) {
    throw apiError('Task not found', {}, 404);
  }
  res.status(204).send();
}

module.exports = { listTasks, getTask, createTask, replaceTask, updateTask, deleteTask };
