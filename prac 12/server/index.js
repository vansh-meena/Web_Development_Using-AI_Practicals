import 'dotenv/config';
import express from 'express';
import imageRouter from './routes/image.js';

const app = express();

// Caption uploads carry base64 image data.
app.use(express.json({ limit: '8mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/image', imageRouter);

// 404 handler for unknown /api routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
  console.log(`Lumora server listening on http://localhost:${PORT}`);
});
