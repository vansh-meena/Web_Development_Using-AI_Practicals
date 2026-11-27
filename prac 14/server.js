const http = require('http');
const fs = require('fs');
const path = require('path');
const router = require('./src/router');

function createServer() {
  return http.createServer((req, res) => router.handle(req, res));
}

if (require.main === module) {
  const PORT = process.env.PORT ? Number(process.env.PORT) : 4010;
  const server = createServer();
  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Vigil listening on port ${PORT}`);
  });
}

module.exports = { createServer };
