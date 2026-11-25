require('dotenv').config();

const app = require('./src/app');
const { connectDatabase } = require('./src/config/db');
const seedStudents = require('./src/seed/students');

const port = process.env.PORT || 4008;

async function start() {
  await connectDatabase();
  await seedStudents();
  app.listen(port, () => {
    console.log(`Student Management System listening on port ${port}`);
  });
}

start();
