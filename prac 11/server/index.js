import 'dotenv/config';
import express from 'express';
import contentRoutes from './routes/content.js';
import { PORT } from './lib/constants.js';

const app = express();

app.use(express.json({ limit: '256kb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/content', contentRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, req, res, next) => {
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body.' });
  }
  return res.status(500).json({ error: 'Server error.' });
});

app.listen(PORT, () => {
  console.log(`PostForge server listening on http://localhost:${PORT}`);
});
