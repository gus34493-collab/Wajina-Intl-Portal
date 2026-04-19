import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
const cookieParser = require('cookie-parser');
const cors = require('cors');
import helmet from 'helmet';
import { doubleCsrf } from 'csrf-csrf';
import path from 'path';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import structureRoutes from './routes/structure';
import usersRoutes from './routes/users';
import auditRoutes from './routes/audit';
import behaviourRoutes from './routes/behaviour';
import paymentsRoutes from './routes/payments';
import attendanceRoutes from './routes/attendance';
import gradesRoutes from './routes/grades';
import parentRoutes from './routes/parent';
import privacyRoutes from './routes/privacy';
import gdprRoutes from './routes/gdpr';
import requestsRoutes from './routes/requests';
import admissionsRoutes from './routes/admissions';
import tasksRoutes from './routes/tasks';
import financeRoutes from './routes/finance';
import risksRoutes from './routes/risks';
import hrRoutes from './routes/hr';
import complaintsRoutes from './routes/complaints';
import analyticsRoutes from './routes/analytics';
import sessionRoutes from './routes/session';
import notificationRoutes from './routes/notifications';


// ─────────────────────────────────────────────────────────────────
// Security Hardening: Environment Checks
// ─────────────────────────────────────────────────────────────────
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('change-me')) {
  console.error('[CRITICAL] JWT_SECRET is not configured or using default value. Server cannot start in this state.');
  if (process.env.NODE_ENV === 'production') process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// Basic request logger
app.use((req: Request, res: Response, next: NextFunction) => {
  if (!req.path.includes('.ico')) {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  }
  next();
});

// ── DETERMINISTIC ROOT PATHING ──────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..');

// ── EMERGENCY CACHE KILLER ───────────────────────────────────────────────────
app.use((req, res, next) => {
  // Force browser to fetch fresh assets on every single request
  if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|json|manifest)$/)) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
  next();
});

// ── SERVICE WORKER PURIFICATION ──────────────────────────────────────────────
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.send(`
    console.log('[Purification] Forced Service Worker Suicide Triggered');
    self.registration.unregister().then(function() {
      return caches.keys().then(function(names) {
        for (let name of names) caches.delete(name);
        console.log('[Purification] SW Unregistered and Caches Purged');
      });
    });
  `);
});

// ── PRIORITY STATIC ASSETS ───────────────────────────────────────────────────
// Serve known asset folders FIRST without any auth/middleware
app.use('/css', express.static(path.join(ROOT, 'css'), { fallthrough: false }));
app.use('/js', express.static(path.join(ROOT, 'js'), { fallthrough: false }));
app.use('/images', express.static(path.join(ROOT, 'images'), { fallthrough: false }));
app.use('/dist-frontend', express.static(path.join(ROOT, 'dist-frontend'), { fallthrough: false }));
app.use('/uploads', express.static(path.join(ROOT, 'uploads'), { fallthrough: false }));
// Serve specific top-level files
app.use(express.static(ROOT, { extensions: ['html', 'json', 'png', 'ico'] }));

// ── Security headers (Helmet) ─────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"], // Strict: No 'unsafe-inline' or external CDNs
      styleSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline permitted for CSS only
      fontSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "http://localhost:3001"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));


// ── CORS ───────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : [`http://localhost:${PORT}`];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// ── Request parsing with size limits ──────────────────────────────────────────
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: false, limit: '50kb' }));
app.use(cookieParser());

// ── CSRF Protection ────────────────────────────────────────────────────────────
const { generateToken, doubleCsrfProtection, invalidCsrfTokenError } = doubleCsrf({
  getSecret: () => process.env.JWT_SECRET || 'csrf-fallback-secret-change-me',
  cookieName: 'wajina_csrf',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    secure: isProd,
    path: '/',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

// Apply CSRF to all non-GET routes
app.use('/api', (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  
  if (process.env.NODE_ENV === 'development') return next();

  doubleCsrfProtection(req, res, next);
});

// Endpoint to get CSRF token (called after login and on page load)
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: generateToken(req, res) });
});

// ── Rate limiting ──────────────────────────────────────────────────────────────
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
const globalLogLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200, // Relaxed for testing
  message: { error: 'Too many requests. Please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100, // Relaxed for testing
  message: { error: 'Too many login attempts. Please try again later.' },
  standardHeaders: true, 
  legacyHeaders: false 
});

const mutationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30, // 30 mutations per minute
  message: { error: 'Slow down. You are sending too many requests.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);

// Mutation protection for sensitive domains
app.use(['/api/grades', '/api/hr', '/api/requests', '/api/finance', '/api/admissions', '/api/behaviour', '/api/users', '/api/structure', '/api/session'], (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return mutationLimiter(req, res, next);
  }
  next();
});

// ── API routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/structure', structureRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/behaviour', behaviourRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/grades', gradesRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/privacy', privacyRoutes);
app.use('/api/gdpr', gdprRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/admissions', admissionsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/risks', risksRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/notifications', notificationRoutes);


// Catch-all: serve index.html for direct URL navigation
app.get('*', (req: Request, res: Response) => {
  // ── THE ASSET SHIELD ──────────────────────────────────────────────────────
  // If an asset is requested but wasn't handled by express.static above,
  // we MUST return a 404. Returning index.html (text/html) for a .css request
  // causes the browser to discard the styles, leading to "unstyled" layouts.
  const isAsset = /\.(css|js|png|jpg|jpeg|gif|ico|svg|woff2?|ttf|otf|json|manifest)$/i.test(req.path) || 
                  req.path.startsWith('/css/') || 
                  req.path.startsWith('/js/') || 
                  req.path.startsWith('/images/') ||
                  req.path.startsWith('/uploads/');

  if (isAsset) {
    console.warn(`[Blocked] Asset not found (Shielded): ${req.path}`);
    return res.status(404).send('Asset Not Found');
  }

  res.sendFile(path.join(ROOT, 'index.html'));
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  // CSRF error
  if (err === invalidCsrfTokenError) {
    return res.status(403).json({ error: 'Invalid or expired session. Please refresh the page and try again.' });
  }

  console.error('[server]', err);

  // Don't leak internal errors in production
  const message = isProd
    ? 'Internal server error'
    : err.message || 'Internal server error';

  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`Wajina Portal server running → http://localhost:${PORT}`);
  if (!isProd) {
    console.warn('[WARN] Running in development mode. Security headers are relaxed.');
  }
});
