const Student = require('../models/Student');

const demoStudents = [
  {
    name: 'Aarav Mehta',
    rollNo: 'CSE-101',
    email: 'aarav.mehta@example.com',
    course: 'CSE',
    year: 1,
    gpa: 8.7
  },
  {
    name: 'Diya Sharma',
    rollNo: 'ECE-204',
    email: 'diya.sharma@example.com',
    course: 'ECE',
    year: 2,
    gpa: 9.1
  },
  {
    name: 'Kabir Singh',
    rollNo: 'ME-307',
    email: 'kabir.singh@example.com',
    course: 'ME',
    year: 3,
    gpa: 7.8
  },
  {
    name: 'Ananya Rao',
    rollNo: 'CE-412',
    email: 'ananya.rao@example.com',
    course: 'CE',
    year: 4,
    gpa: 8.4
  },
  {
    name: 'Vihaan Patel',
    rollNo: 'CSE-118',
    email: 'vihaan.patel@example.com',
    course: 'CSE',
    year: 1,
    gpa: 9.5
  },
  {
    name: 'Ishita Nair',
    rollNo: 'ECE-326',
    email: 'ishita.nair@example.com',
    course: 'ECE',
    year: 3,
    gpa: 8.9
  }
];

async function seedStudents() {
  await Promise.all(
    demoStudents.map((student) =>
      Student.findOneAndUpdate(
        { rollNo: student.rollNo },
        { $setOnInsert: student },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );

  console.log(`Ensured ${demoStudents.length} demo students exist.`);
}

async function runSeed() {
  require('dotenv').config();
  const { connectDatabase, closeDatabase } = require('../config/db');

  await connectDatabase();
  await seedStudents();
  await closeDatabase();
}

if (require.main === module) {
  runSeed();
}

module.exports = seedStudents;
