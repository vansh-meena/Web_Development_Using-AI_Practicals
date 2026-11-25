const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const {
  listTasks,
  getTask,
  createTask,
  replaceTask,
  updateTask,
  deleteTask
} = require('../controllers/taskController');

const router = express.Router();

router.get('/', asyncHandler(listTasks));
router.post('/', asyncHandler(createTask));
router.get('/:id', asyncHandler(getTask));
router.put('/:id', asyncHandler(replaceTask));
router.patch('/:id', asyncHandler(updateTask));
router.delete('/:id', asyncHandler(deleteTask));

module.exports = router;
