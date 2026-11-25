# Product Catalogue API

A RESTful API for a product catalogue built with Node.js, Express and MongoDB (Mongoose). API-only: no frontend. It ships with a Swagger UI, an OpenAPI 3.0.3 spec and a ready-to-import Postman collection.

## Setup

1. Install Node.js 18+.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and adjust if needed:

   ```
   PORT=4007
   MONGODB_URI=
   ```

   - `PORT` — port the server listens on (default `4007`).
   - `MONGODB_URI` — connection string for a real MongoDB. If left empty, the server starts an in-memory MongoDB: the console will clearly warn that data is temporary, and sample seed data is loaded automatically when the collection is empty.

4. Start the server:

   ```bash
   npm start
   ```

   Verify at `http://localhost:4007/api/health`.

## Scripts

| Script | What it does |
| --- | --- |
| `npm start` | Start the API server |
| `npm run seed` | Clear and re-seed the configured database with 8 sample products |
| `npm run validate:spec` | Validate `docs/openapi.json` with swagger-parser |

## Endpoint overview

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Health check: `{ status, db }` |
| GET | `/api/products` | List products with filters, search, pagination, sorting |
| POST | `/api/products` | Create a product (201 + `Location` header) |
| GET | `/api/products/:id` | Get one product (404 if missing) |
| PUT | `/api/products/:id` | Full replace (omitted optional fields reset to defaults) |
| PATCH | `/api/products/:id` | Partial update (at least one valid field required) |
| DELETE | `/api/products/:id` | Delete a product (204, no body) |

### Query parameters on GET /api/products

| Parameter | Rules |
| --- | --- |
| `category` | One of `electronics`, `apparel`, `books`, `home`; anything else is a 400 |
| `inStock` | Only `true` or `false`; anything else is a 400 |
| `search` | Case-insensitive match against name or description (regex-escaped) |
| `page` | Default `1` |
| `limit` | Default `10`, capped at `100` |
| `sort` | Whitelist: `name`, `price`, `quantity`, `createdAt`, `updatedAt`, with optional leading `-` for descending; default `-createdAt` |

Only `name`, `description`, `category`, `price`, `quantity` and `inStock` are accepted in request bodies; all other fields are ignored. Duplicate product names return `409`. Errors always have the shape `{ error: { code, message, details? } }`.

## Example curl commands

```bash
# Health
curl http://localhost:4007/api/health

# List (filter + search + paginate + sort)
curl "http://localhost:4007/api/products?category=electronics&inStock=true&search=head&page=1&limit=10&sort=-price"

# Create
curl -X POST http://localhost:4007/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Lumen Desk Lamp","description":"LED lamp with touch dimming.","category":"home","price":59.9,"quantity":20}'

# Get by id
curl http://localhost:4007/api/products/<id>

# Full replace
curl -X PUT http://localhost:4007/api/products/<id> \
  -H "Content-Type: application/json" \
  -d '{"name":"Lumen Desk Lamp","category":"home","price":49.9}'

# Partial update
curl -X PATCH http://localhost:4007/api/products/<id> \
  -H "Content-Type: application/json" \
  -d '{"price":44.9}'

# Delete
curl -X DELETE http://localhost:4007/api/products/<id>
```

## Postman

1. Open Postman and choose **Import**.
2. Import both files:
   - `postman/product-catalogue.postman_collection.json`
   - `postman/local.postman_environment.json`
3. Select the **local** environment, then run the collection from the top. Requests are in dependency order:
   health → list → create → get by id → PUT → PATCH → delete → get deleted (404) → invalid id (400).
4. The create request saves the new product id into the `productId` collection variable automatically, so later requests use it. Every request has test assertions for its expected status code and body shape.

## API documentation (Swagger UI)

With the server running, open:

- Swagger UI: `http://localhost:4007/api-docs`
- Raw OpenAPI spec: `http://localhost:4007/api/openapi.json`

The spec source lives in `docs/openapi.json`; validate it any time with `npm run validate:spec`.
