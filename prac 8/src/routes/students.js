const express = require('express');
const {
  listStudents,
  getStudentStats,
  getStudent,
  createStudent,
  replaceStudent,
  updateStudent,
  deleteStudent
} = require('../controllers/students');

const router = express.Router();

// Express does not catch errors thrown inside async handlers, so forward them
// to the error middleware manually.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/stats', wrap(getStudentStats));
router.get('/', wrap(listStudents));
router.post('/', wrap(createStudent));
router.get('/:id', wrap(getStudent));
router.put('/:id', wrap(replaceStudent));
router.patch('/:id', wrap(updateStudent));
router.delete('/:id', wrap(deleteStudent));

module.exports = router;
