"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet_1 = __importDefault(require("helmet"));
const csrf_csrf_1 = require("csrf-csrf");
const path_1 = __importDefault(require("path"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = __importDefault(require("./routes/auth"));
const structure_1 = __importDefault(require("./routes/structure"));
const users_1 = __importDefault(require("./routes/users"));
const audit_1 = __importDefault(require("./routes/audit"));
const behaviour_1 = __importDefault(require("./routes/behaviour"));
const payments_1 = __importDefault(require("./routes/payments"));
const attendance_1 = __importDefault(require("./routes/attendance"));
const grades_1 = __importDefault(require("./routes/grades"));
const parent_1 = __importDefault(require("./routes/parent"));
const privacy_1 = __importDefault(require("./routes/privacy"));
const gdpr_1 = __importDefault(require("./routes/gdpr"));
const requests_1 = __importDefault(require("./routes/requests"));
const admissions_1 = __importDefault(require("./routes/admissions"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const finance_1 = __importDefault(require("./routes/finance"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';
// Basic request logger
app.use((req, res, next) => {
    if (!req.path.includes('.ico')) {
        console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
    }
    next();
});
// ── Security headers (Helmet) ─────────────────────────────────────────────────
app.use((0, helmet_1.default)({
    contentSecurityPolicy: isProd ? {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
        },
    } : false,
    crossOriginEmbedderPolicy: false, // needed for some frontend features
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
app.use(express_1.default.json({ limit: '50kb' }));
app.use(express_1.default.urlencoded({ extended: false, limit: '50kb' }));
app.use(cookieParser());
// ── CSRF Protection ────────────────────────────────────────────────────────────
const { generateToken, doubleCsrfProtection, invalidCsrfTokenError } = (0, csrf_csrf_1.doubleCsrf)({
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
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method))
        return next();
    if (process.env.NODE_ENV === 'development')
        return next();
    doubleCsrfProtection(req, res, next);
});
// Endpoint to get CSRF token (called after login and on page load)
app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: generateToken(req, res) });
});
// ── Rate limiting ──────────────────────────────────────────────────────────────
const limiter = (0, express_rate_limit_1.default)({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
const authLimiter = (0, express_rate_limit_1.default)({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });
app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
// ── API routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', auth_1.default);
app.use('/api/structure', structure_1.default);
app.use('/api/users', users_1.default);
app.use('/api/audit', audit_1.default);
app.use('/api/behaviour', behaviour_1.default);
app.use('/api/payments', payments_1.default);
app.use('/api/attendance', attendance_1.default);
app.use('/api/grades', grades_1.default);
app.use('/api/parent', parent_1.default);
app.use('/api/privacy', privacy_1.default);
app.use('/api/gdpr', gdpr_1.default);
app.use('/api/requests', requests_1.default);
app.use('/api/admissions', admissions_1.default);
app.use('/api/tasks', tasks_1.default);
app.use('/api/finance', finance_1.default);
// ── Serve static frontend ──────────────────────────────────────────────────────
const ROOT = path_1.default.join(__dirname, '..');
app.use(express_1.default.static(ROOT, { extensions: ['html'] }));
// Catch-all: serve index.html for direct URL navigation
app.get('*', (_req, res) => {
    res.sendFile(path_1.default.join(ROOT, 'index.html'));
});
// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
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
