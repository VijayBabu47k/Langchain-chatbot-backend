import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';

import { config } from './config/config.js';
import chatRoutes from './routes/chatRoutes.js';
import imageRoutes from './routes/imageRoutes.js';
import unifiedRoutes from './routes/unifiedRoutes.js';

const app = express();

// Middleware
app.use(cors({ origin: config.CORS_ORIGIN }));
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  useTempFiles: true,
  tempFileDir: '/tmp/',
  safeFileNames: true,
  preserveExtension: true,
  abortOnLimit: true,
  responseOnLimit: 'File is too large',
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging Middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', unifiedRoutes);
app.use('/api', chatRoutes);
app.use('/api', imageRoutes);

// Start Server
app.listen(config.PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${config.PORT}`);
  console.log(`📝 Environment: ${config.NODE_ENV}`);
});
