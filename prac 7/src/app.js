const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const openapi = require('../docs/openapi.json');
const productsRouter = require('./routes/products');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', require('./controllers/health'));
app.get('/api/openapi.json', (req, res) => {
  res.json(openapi);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi));

app.use('/api/products', productsRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
