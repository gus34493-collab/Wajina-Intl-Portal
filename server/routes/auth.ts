import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Resend } from 'resend';
import rateLimit from 'express-rate-limit';
import prisma from '../prisma';
import { auth, signAndSet, clearCookie } from '../middleware/auth';
import { audit } from '../middleware/audit';

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

// ── Password validation helper ────────────────────────────────────────────────
function validatePasswordStrength(password: string) {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  if (!PASSWORD_REGEX.test(password)) {
    return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.';
  }
  return null;
}

// ── Rate-limit forgot-password ────────────────────────────────────────────────
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many reset requests. Please wait 15 minutes before trying again.' },
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req: any, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user: any = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true, email: true, name: true, role: true, status: true,
        campus: true, password: true, profilePhoto: true,
        failedLoginAttempts: true, lockedUntil: true, tokenVersion: true,
      },
    });

    if (!user) {
      audit(null, 'LOGIN_FAILED', 'User', null, `Unknown email: ${email.toLowerCase().trim()}`, req.ip);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      return res.status(429).json({
        error: `Account locked due to too many failed attempts. Try again in ${remaining} minute(s).`,
        locked: true,
      });
    }

    if (user.status === 'DISABLED') {
      audit(user.id, 'LOGIN_BLOCKED', 'User', user.id, 'Account disabled', req.ip);
      return res.status(403).json({ error: 'Your account has been disabled. Contact the administrator.' });
    }

    if (user.status === 'PENDING') {
      audit(user.id, 'LOGIN_BLOCKED', 'User', user.id, 'Account pending activation', req.ip);
      return res.status(403).json({ error: 'Your account is pending activation. Please wait for administrator approval.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const newAttempts = (user.failedLoginAttempts || 0) + 1;

      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        // Lock the account
        const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        await prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: newAttempts, lockedUntil },
        });
        audit(user.id, 'ACCOUNT_LOCKED', 'User', user.id, `Locked after ${newAttempts} failed attempts`, req.ip);
        return res.status(429).json({
          error: 'Account locked due to too many failed attempts. Try again in 30 minutes.',
          locked: true,
        });
      }

      // Increment failed attempts
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: newAttempts },
      });
      audit(user.id, 'LOGIN_FAILED', 'User', user.id, `Wrong password (attempt ${newAttempts}/${MAX_LOGIN_ATTEMPTS})`, req.ip);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Successful login — reset counter
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    const payload = {
      id: user.id, email: user.email, role: user.role, name: user.name,
      campus: user.campus, tokenVersion: user.tokenVersion,
    };
    signAndSet(res, payload);

    audit(user.id, 'LOGIN', 'User', user.id, null, req.ip);

    res.json({
      id: user.id, email: user.email, name: user.name,
      role: user.role, campus: user.campus, profilePhoto: user.profilePhoto,
    });
  } catch (err: any) {
    next(err);
  }
});

// ── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', auth, async (req: any, res, next) => {
  try {
    clearCookie(res);
    audit(req.user.id, 'LOGOUT', 'User', req.user.id, null, req.ip);
    res.json({ message: 'Logged out successfully' });
  } catch (err: any) {
    next(err);
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', auth, async (req: any, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, name: true, role: true, status: true,
        phone: true, profilePhoto: true, consentGiven: true, consentDate: true,
        campus: true, // Fixed: Required for dashboard redirection logic
        enrolledArm: {
          select: {
            id: true, fullName: true,
            class: { select: { name: true, campus: true } },
          },
        },
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err: any) {
    next(err);
  }
});

// ── POST /api/auth/change-password ───────────────────────────────────────────
router.post('/change-password', auth, async (req: any, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new password are required' });
    }

    const pwError = validatePasswordStrength(newPassword);
    if (pwError) return res.status(400).json({ error: pwError });

    const user: any = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, password: true, tokenVersion: true },
    });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashed, tokenVersion: { increment: 1 } },
    });

    clearCookie(res);
    audit(req.user.id, 'PASSWORD_CHANGED', 'User', req.user.id, null, req.ip);
    res.json({ message: 'Password changed. Please log in again.' });
  } catch (err: any) {
    next(err);
  }
});

// ── POST /api/auth/forgot-password ──────────────────────────────────────────
router.post('/forgot-password', forgotPasswordLimiter, async (req: any, res, next) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, name: true, email: true, status: true },
    });

    const genericOk = { message: 'If an account with that email exists, a reset link has been sent.' };
    if (!user || user.status === 'DISABLED') return res.json(genericOk);

    // Invalidate all existing unused tokens
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt, ipAddress: req.ip },
    });

    const APP_URL = process.env.APP_URL || 'http://localhost:3000';
    const resetUrl = `${APP_URL}/portal.html?token=${rawToken}`;
    const firstName = user.name.split(' ')[0];

    try {
      await resend.emails.send({
        from: (process.env.EMAIL_FROM as string) || 'Wajina Portal <noreply@wajina.edu.ng>',
        to: user.email,
        subject: 'Reset Your Password — Wajina International Schools',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;">
            <h2 style="margin-bottom:8px;">Password Reset Request</h2>
            <p>Hello ${firstName},</p>
            <p>We received a request to reset your Wajina Portal password. Click the button below to set a new password. This link expires in <strong>15 minutes</strong> and can only be used once.</p>
            <div style="text-align:center;margin:28px 0;">
              <a href="${resetUrl}" style="background:#0f8f62;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:15px;">Reset My Password</a>
            </div>
            <p style="font-size:13px;color:#666;">If you did not request this, you can safely ignore this email. Your password will not change.</p>
            <p style="font-size:12px;color:#aaa;margin-top:24px;">Wajina International Schools &mdash; Portal Security</p>
          </div>`,
      });
    } catch (emailErr: any) {
      console.error('[forgot-password] Email send failed:', emailErr.message);
    }

    res.json(genericOk);
  } catch (err: any) { next(err); }
});

// ── POST /api/auth/reset-password ───────────────────────────────────────────
router.post('/reset-password', async (req: any, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    const pwError = validatePasswordStrength(password);
    if (pwError) return res.status(400).json({ error: pwError });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt || (record.expiresAt < new Date())) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired. Please request a new one.' });
    }

    const hashed = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { password: hashed, tokenVersion: { increment: 1 }, failedLoginAttempts: 0, lockedUntil: null },
      }),
      prisma.passwordResetToken.update({ where: { tokenHash }, data: { usedAt: new Date() } }),
    ]);

    audit(record.userId, 'PASSWORD_RESET', 'User', record.userId, null, req.ip);
    clearCookie(res);
    res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (err: any) { next(err); }
});

export default router;
