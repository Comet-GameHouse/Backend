const http = require('http');
require('dotenv').config();

// Import services
const { connectDB } = require('./app/services/databaseService');
const createAPIService = require('./app/services/mainAPIService');
const createSocketService = require('./app/services/socketService');

// Initialize services
const app = createAPIService();
const server = http.createServer(app);
const { wss, sendNotificationToUser } = createSocketService(server);

// Make sendNotificationToUser available globally for routes
global.sendNotificationToUser = sendNotificationToUser;

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API: http://localhost:${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}/ws`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    const { disconnectDB } = require('./app/services/databaseService');
    disconnectDB();
  });
});
