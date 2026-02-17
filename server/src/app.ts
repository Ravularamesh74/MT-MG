import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import routes from './routes';
import errorHandler from './middleware/errorHandler';
import { config } from './config/env';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS
app.use(
    cors({
        origin: config.corsOrigin,
        credentials: true,
    })
);

// Cookie parser
app.use(cookieParser());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport initialization
app.use(passport.initialize());

// Logging
if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
}

// API routes
app.use('/api', routes);

// Root route
app.get('/', (_req, res) => {
    res.json({
        success: true,
        message: 'Mallikarjuna Travels API',
        version: '2.0.0',
        features: ['JWT Auth + Refresh Tokens', 'Google OAuth', 'RBAC', 'Real-time Tracking', 'Payment Webhooks', 'Booking State Machine'],
        documentation: '/api/health',
    });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
