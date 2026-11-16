import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import { ALLOWED_ORIGINS } from './config/env.js';
import { apiLimiter, trackRequestMetrics } from './middleware/rateLimiters.js';
import systemRoutes from './routes/system.js';
import authRoutes from './routes/auth.js';
import coursesRoutes from './routes/courses.js';
import papersRoutes from './routes/papers.js';
import adminRoutes from './routes/admin.js';
import contestsRoutes from './routes/contests.js';

const app = express();
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        objectSrc: ["'self'"],
        styleSrc: ["'unsafe-inline'"],
        frameAncestors: [
          "'self'",
          'https://exam-quiz-portal-lib-jklu.vercel.app',
          'https://*.vercel.app',
          'http://localhost:*',
          'http://127.0.0.1:*',
        ],
      },
    },
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/$/, '');
      if (
        ALLOWED_ORIGINS.has(normalized) ||
        /^https:\/\/(exam-quiz-portal|paper-portal)[a-z0-9-]*\.vercel\.app$/i.test(normalized) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalized)
      ) {
        return callback(null, true);
      }
      console.warn('⚠️ [CORS] Blocked origin:', normalized);
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Range'],
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Disposition'],
  })
);
app.use(compression());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(apiLimiter);
app.use(trackRequestMetrics);

app.use('/', systemRoutes);
app.use('/', authRoutes);
app.use('/courses', coursesRoutes);
app.use('/', papersRoutes);
app.use('/admin', adminRoutes);
app.use('/', contestsRoutes);

app.use((err, _req, res, _next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ detail: 'File size must be 500 KB or less.' });
    return;
  }
  console.error('[Unhandled Server Error]', err);
  res.status(500).json({ detail: 'Error' });
});

export default app;
