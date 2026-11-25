# Task Manager API

## Setup

1. Copy `.env.example` to `.env`.
2. Set `MONGODB_URI` to a MongoDB connection string when persistent storage is needed.
3. Run `npm install` and then `npm run dev` from the project root.

When `MONGODB_URI` is empty, the server starts a temporary `mongodb-memory-server` database. Its data is removed when the server stops.

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `5003` | Port used by the Express API |
| `MONGODB_URI` | empty | MongoDB connection string |

## API

| Method | Route | Description |
| --- | --- | --- |
| GET | `/api/health` | Reports API and database status |
| GET | `/api/tasks` | Lists tasks with search, filter, sorting, and pagination |
| GET | `/api/tasks/:id` | Reads one task |
| POST | `/api/tasks` | Creates a task |
| PUT | `/api/tasks/:id` | Replaces a task |
| PATCH | `/api/tasks/:id` | Updates selected task fields |
| DELETE | `/api/tasks/:id` | Deletes a task |

`GET /api/tasks` accepts `search`, `done=true|false`, `sort=-createdAt|createdAt|updatedAt|title|priority`, `page`, and `limit` query parameters. The limit is capped at 100.

## curl examples

```bash
curl http://localhost:5003/api/health

curl -X POST http://localhost:5003/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Plan release","description":"Review the checklist","priority":"high"}'

curl "http://localhost:5003/api/tasks?search=release&done=false&sort=-createdAt&page=1&limit=10"

curl -X PATCH http://localhost:5003/api/tasks/TASK_ID \
  -H "Content-Type: application/json" \
  -d '{"done":true}'

curl -X DELETE http://localhost:5003/api/tasks/TASK_ID
```
