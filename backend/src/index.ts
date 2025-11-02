import dotenv from 'dotenv';

// Load environment variables first, before any other imports
dotenv.config();

import express from 'express';
import http from 'http';
import { connectDB } from './database/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware';
import router from './routes/routes';
import path from 'path';
dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

// Create HTTP server
const httpServer = http.createServer(app);

// Initialize WebSocket service
const chatWebSocketService = new ChatWebSocketService(httpServer);

// Make chat service available globally
declare global {
  var chatWebSocketService: ChatWebSocketService | undefined;
}
global.chatWebSocketService = chatWebSocketService;

app.use(express.json());

app.use('/api', router);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('*', notFoundHandler);
app.use(errorHandler);

void connectDB();
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
