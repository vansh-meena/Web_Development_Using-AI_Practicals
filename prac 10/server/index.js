import 'dotenv/config';
import express from 'express';
import chatRouter from './routes/chat.js';

const app = express();
const PORT = process.env.PORT || 5003;

app.use(express.json({ limit: '16kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/chat', chatRouter);

// Final error handler: never leak stack traces to the client.
app.use((err, _req, res, _next) => {
  if (err?.type === 'entity.too.large' || err?.type === 'entity.parse.failed') {
    res.status(400).json({
      error: 'Validation failed',
      details: { message: 'The request body could not be read.' },
    });
    return;
  }
  console.error('Unexpected server error:', err?.message || err);
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
});

app.listen(PORT, () => {
  console.log(`Platypus University Help Center server listening on http://localhost:${PORT}`);
});
