// path: src/server.ts
import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { apiRouter } from './routes.js';
import { logger } from './lib/logger.js';

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', apiRouter);

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', { error: String(err?.message || err) });
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
  logger.info(`Server starting on http://localhost:${port}`);
  logger.info(`Log level: ${process.env.LOG_LEVEL || 'info'}`);
});

export default app;
