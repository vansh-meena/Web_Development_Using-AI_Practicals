# Student Management System

A straightforward Student Management System built with Express.js, MongoDB, and Mongoose.

## Setup

Requirements:

- Node.js 18 or newer
- MongoDB, or the included temporary in-memory MongoDB fallback

Install dependencies:

```bash
npm install
```

Create a `.env` file from `.env.example` when you want to use a MongoDB instance. If `MONGODB_URI` is empty or omitted, the server starts a temporary in-memory database and logs that the data will be lost when the server stops.

Start the server:

```bash
npm start
```

Seed the database manually:

```bash
npm run seed
```

The server also ensures the six demo students are present automatically at startup. Seeding is idempotent.

## Environment variables

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | Port used by the server | `4008` |
| `MONGODB_URI` | MongoDB connection string | Empty; uses temporary in-memory MongoDB |

## Endpoints

Base URL: `http://localhost:4008`

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| GET | `/api/students` | List students with search, course, pagination, and sorting |
| GET | `/api/students/stats` | Get overall and per-course GPA statistics |
| GET | `/api/students/:id` | Get one student |
| POST | `/api/students` | Create a student |
| PUT | `/api/students/:id` | Replace a student |
| PATCH | `/api/students/:id` | Update part of a student |
| DELETE | `/api/students/:id` | Delete a student |

The list endpoint accepts `search`, `course`, `page`, `limit`, and `sort` query parameters.

## Example curl commands

Check health:

```bash
curl http://localhost:4008/api/health
```

List students:

```bash
curl "http://localhost:4008/api/students?search=aarav&page=1&limit=10&sort=-gpa"
```

Filter by course:

```bash
curl "http://localhost:4008/api/students?course=CSE"
```

View statistics:

```bash
curl http://localhost:4008/api/students/stats
```

Create a student:

```bash
curl -X POST http://localhost:4008/api/students \
  -H "Content-Type: application/json" \
  -d '{"name":"Riya Kapoor","rollNo":"CSE-509","email":"riya.kapoor@example.com","course":"CSE","year":2,"gpa":8.8}'
```

Update a student partially:

```bash
curl -X PATCH http://localhost:4008/api/students/STUDENT_ID \
  -H "Content-Type: application/json" \
  -d '{"gpa":9.2}'
```

Delete a student:

```bash
curl -X DELETE http://localhost:4008/api/students/STUDENT_ID
```
