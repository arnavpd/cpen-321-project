// Test application setup for unmocked tests
import express from 'express';
import { connectTestDB } from './testDatabase';
import { errorHandler, notFoundHandler } from '../src/middleware/errorHandler.middleware';
import router from '../src/routes/routes';

export const createTestApp = async () => {
  const app = express();
  
  // Middleware setup
  app.use(express.json());
  
  // Routes
  app.use('/api', router);
  
  // Error handling
  app.use('*', notFoundHandler);
  app.use(errorHandler);
  
  // Connect to test database with CI-optimized settings
  await connectTestDB();
  
  return app;
};