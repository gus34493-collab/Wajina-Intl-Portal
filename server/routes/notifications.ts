import express from 'express';
import webpush from 'web-push';
import prisma from '../prisma';
import { auth } from '../middleware/auth';
import { audit } from '../middleware/audit';

const router = express.Router();

// ── VAPID Configuration ──────────────────────────────────────────────────────
const publicKey = process.env.VAPID_PUBLIC_KEY || '';
const privateKey = process.env.VAPID_PRIVATE_KEY || '';
const email = process.env.VAPID_EMAIL || 'mailto:admin@wajina.edu.ng';

if (publicKey && privateKey) {
  webpush.setVapidDetails(email, publicKey, privateKey);
}

// ── GET /api/notifications/vapid-key ─────────────────────────────────────────
router.get('/vapid-key', auth, (req, res) => {
  res.json({ publicKey });
});

// ── POST /api/notifications/subscribe ────────────────────────────────────────
router.post('/subscribe', auth, async (req: any, res, next) => {
  try {
    const subscription = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid push subscription data' });
    }

    // Save subscription to user profile
    await prisma.user.update({
      where: { id: req.user.id },
      data: { pushSubscription: subscription as any }
    });

    audit(req.user.id, 'PUSH_SUBSCRIBE', 'User', req.user.id, 'Authenticated for PWA App Alerts', req.ip);
    res.status(201).json({ message: 'Push subscription synchronized successfully' });
  } catch (err) { next(err); }
});

// ── Internal Utility: sendPush (Not a route) ──────────────────────────────────
export const sendPush = async (userId: string, title: string, body: string, url: string = '/') => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushSubscription: true }
    });

    if (!user || !user.pushSubscription) return;

    const payload = JSON.stringify({
      title,
      body,
      url,
      icon: '/images/icon-192.png',
      badge: '/images/icon-192.png'
    });

    await webpush.sendNotification(user.pushSubscription as any, payload);
    console.log(`[Push] Successfully sent to user ${userId}`);
  } catch (err: any) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      console.warn(`[Push] Subscription expired or removed for user ${userId}. Cleaning up.`);
      await prisma.user.update({
        where: { id: userId },
        data: { pushSubscription: null }
      });
    } else {
      console.error(`[Push] Error sending to user ${userId}:`, err.message);
    }
  }
};

export default router;
