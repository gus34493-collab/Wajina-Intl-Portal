"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = auth;
exports.requireRole = requireRole;
exports.signAndSet = signAndSet;
exports.clearCookie = clearCookie;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../prisma"));
const SECRET = process.env.JWT_SECRET;
const COOKIE = 'wajina_token';
/**
 * Verify the HttpOnly cookie and attach req.user = { id, role, email }.
 * Also validates tokenVersion against the database for session revocation.
 * Responds 401 if missing or invalid.
 */
async function auth(req, res, next) {
    const token = req.cookies?.[COOKIE];
    if (!token)
        return res.status(401).json({ error: 'Not authenticated' });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, SECRET);
        // Verify tokenVersion matches database (session revocation check)
        if (decoded.tokenVersion !== undefined) {
            const user = await prisma_1.default.user.findUnique({
                where: { id: decoded.id },
                select: { tokenVersion: true, status: true },
            });
            if (!user) {
                clearCookie(res);
                return res.status(401).json({ error: 'User not found — please log in again' });
            }
            if (user.status === 'DISABLED') {
                clearCookie(res);
                return res.status(403).json({ error: 'Your account has been disabled. Contact the administrator.' });
            }
            if (user.tokenVersion !== decoded.tokenVersion) {
                clearCookie(res);
                return res.status(403).json({ error: 'Session expired — please log in again' });
            }
        }
        req.user = decoded;
        next();
    }
    catch {
        clearCookie(res);
        return res.status(401).json({ error: 'Session expired — please log in again' });
    }
}
/**
 * Role-based guard. Call after auth().
 * Usage: requireRole('DIRECTOR') or requireRole('PRINCIPAL','DIRECTOR')
 */
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ error: 'Not authenticated' });
        const userRole = req.user.role;
        if (!roles.includes(userRole)) {
            return res.status(403).json({ error: `Insufficient permissions. Required one of: ${roles.join(', ')}` });
        }
        next();
    };
}
/**
 * Sign a JWT and set it as an HttpOnly cookie.
 */
function signAndSet(res, payload) {
    const token = jsonwebtoken_1.default.sign(payload, SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });
    res.cookie(COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 8 * 60 * 60 * 1000, // 8 h in ms
    });
    return token;
}
function clearCookie(res) {
    res.clearCookie(COOKIE, { httpOnly: true, sameSite: 'strict' });
}
