import http from 'http';
import app from './app';
import connectDB from './config/db';
import { config } from './config/env';
import { initializeSocket } from './config/socket';

// Import strategies to register them
import './strategies/jwt.strategy';
import './strategies/google.strategy';

// Connect to database
connectDB();

// Create HTTP server and attach Socket.IO
const httpServer = http.createServer(app);
initializeSocket(httpServer);

// Start server
const PORT = config.port;

httpServer.listen(PORT, () => {
    console.log(`🚀 Server running in ${config.nodeEnv} mode on port ${PORT}`);
    console.log(`📍 API available at http://localhost:${PORT}/api`);
    console.log(`🔌 Socket.IO ready for real-time connections`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
    console.error(`❌ Unhandled Rejection: ${err.message}`);
    httpServer.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Shutting down gracefully...');
    httpServer.close(() => {
        console.log('✅ Process terminated');
    });
});
