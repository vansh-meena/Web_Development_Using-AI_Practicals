import 'dotenv/config';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: '64kb' }));

const apiRouter = (await import('./routes/generate.js')).default;
app.use('/api', apiRouter);

app.listen(PORT, () => {
  console.log(`AI Text Studio server listening on http://localhost:${PORT}`);
});
