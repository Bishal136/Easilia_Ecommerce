import 'dotenv/config';
import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';

import apiRouter from './routes/index.js';
import { generalLimiter } from './middlewares/rateLimiter.js';
import mongoSanitizeMiddleware from './middlewares/sanitizeMiddleware.js';
import corsOptions from './config/cors.js';
import errorHandler from './middlewares/errorMiddleware.js';
import ApiError from './utils/ApiError.js';
import ApiResponse from './utils/ApiResponse.js';

const app = express();

// Enable trust proxy for production deployments behind reverse proxies (Nginx, Cloudflare, Render, Railway, etc.)
app.set('trust proxy', 1);

// 1. Security Headers with Cross-Origin Resource Policy for VPS Media
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 2. CORS Configuration (Dynamically configured via .env CORS_ORIGIN & CLIENT_URL)
app.use(cors(corsOptions));

// 3. Request Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 4. Rate Limiting for API routes
app.use('/api', generalLimiter);

// 5. Body Parsers & Data Sanitization
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(mongoSanitizeMiddleware);

// 6. Response Compression
app.use(compression());

// 7. Serve Uploaded Files & Media from VPS Local Storage
const uploadDirectory = path.resolve(process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadDirectory));

// 8. Root Entry Route
app.get('/', (req, res) => {
  res.status(200).json(
    new ApiResponse(200, 'Nerob Ecommerce API is running', {
      version: '1.0.0',
      apiDocs: '/api/v1',
      health: '/api/v1/health',
      uploads: '/uploads',
    })
  );
});

// 9. Mount API v1 Routes
app.use('/api/v1', apiRouter);

// 10. 404 Catch-all Handler for unhandled routes
app.use((req, res, next) => {
  next(new ApiError(404, `Cannot ${req.method} ${req.originalUrl} - Route not found`));
});

// 11. Global Error Handling Middleware
app.use(errorHandler);

export default app;
