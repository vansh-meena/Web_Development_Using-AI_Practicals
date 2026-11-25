const Student = require('../models/Student');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function listStudents(req, res) {
  const { search, course, sort } = req.query;
  const page = Number.parseInt(req.query.page, 10) || 1;
  const limit = Number.parseInt(req.query.limit, 10) || 10;
  const filter = {};

  if (search) {
    const escapedSearch = escapeRegex(String(search));
    filter.$or = [
      { name: { $regex: escapedSearch, $options: 'i' } },
      { rollNo: { $regex: escapedSearch, $options: 'i' } },
      { email: { $regex: escapedSearch, $options: 'i' } }
    ];
  }

  if (course) {
    filter.course = course;
  }

  const [data, total] = await Promise.all([
    Student.find(filter)
      .sort(sort || '-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    Student.countDocuments(filter)
  ]);

  res.json({
    data,
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}

async function getStudentStats(req, res) {
  const [result] = await Student.aggregate([
    {
      $facet: {
        overall: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              averageGpa: { $avg: '$gpa' }
            }
          }
        ],
        byCourse: [
          {
            $group: {
              _id: '$course',
              count: { $sum: 1 },
              averageGpa: { $avg: '$gpa' }
            }
          },
          { $sort: { _id: 1 } }
        ]
      }
    }
  ]);

  const overall = result.overall[0] || { total: 0, averageGpa: 0 };

  res.json({
    total: overall.total,
    averageGpa: Number((overall.averageGpa || 0).toFixed(2)),
    byCourse: result.byCourse.map((course) => ({
      course: course._id,
      count: course.count,
      averageGpa: Number(course.averageGpa.toFixed(2))
    }))
  });
}

async function getStudent(req, res) {
  const student = await Student.findById(req.params.id);

  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  res.json(student);
}

async function createStudent(req, res) {
  const student = await Student.create(req.body);
  res.status(201).json(student);
}

async function replaceStudent(req, res) {
  const student = await Student.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true, overwrite: true, setDefaultsOnInsert: true }
  );

  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  res.json(student);
}

async function updateStudent(req, res) {
  const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  res.json(student);
}

async function deleteStudent(req, res) {
  const student = await Student.findByIdAndDelete(req.params.id);

  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  res.status(204).send();
}

module.exports = {
  listStudents,
  getStudentStats,
  getStudent,
  createStudent,
  replaceStudent,
  updateStudent,
  deleteStudent
};
