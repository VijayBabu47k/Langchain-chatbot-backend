import express from 'express';
import cors from 'cors';

import { config } from './config/config.js';
import chatRoutes from './routes/chatRoutes.js';
import imageRoutes from './routes/imageRoutes.js';

const app = express();

// Middleware
app.use(cors({ origin: config.CORS_ORIGIN }));
app.use(express.json());

// Logging Middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', chatRoutes);
app.use('/api', imageRoutes);

// Start Server
app.listen(config.PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${config.PORT}`);
  console.log(`📝 Environment: ${config.NODE_ENV}`);
});
