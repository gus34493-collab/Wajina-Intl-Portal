import jwt from 'jsonwebtoken';
import prisma from '../prisma';

const SECRET: any = process.env.JWT_SECRET;
const COOKIE = 'wajina_token';

/**
 * Verify the HttpOnly cookie and attach req.user = { id, role, email }.
 * Also validates tokenVersion against the database for session revocation.
 * Responds 401 if missing or invalid.
 */
export async function auth(req: any, res: any, next: any) {
  const token = req.cookies?.[COOKIE];
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const decoded: any = jwt.verify(token, SECRET);
    
    // Verify tokenVersion matches database (session revocation check)
    if (decoded.tokenVersion !== undefined) {
      const user = await prisma.user.findUnique({
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
      if (user.status === 'PENDING') {
        clearCookie(res);
        return res.status(403).json({ error: 'Your account is pending activation. Please wait for administrator approval.' });
      }
      if (user.tokenVersion !== decoded.tokenVersion) {
        clearCookie(res);
        return res.status(403).json({ error: 'Session expired — please log in again' });
      }
    }

    req.user = decoded;
    next();
  } catch {
    clearCookie(res);
    return res.status(401).json({ error: 'Session expired — please log in again' });
  }
}

/**
 * Role-based guard. Call after auth().
 * Usage: requireRole('DIRECTOR') or requireRole('PRINCIPAL','DIRECTOR')
 */
export function requireRole(...roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    
    const userRole = req.user.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: `Insufficient permissions. Required one of: ${roles.join(', ')}` });
    }
    next();
  };
}

/**
 * Campus-based guard. Call after auth().
 * Strictly locks access to a specific campus (PRIMARY or SECONDARY).
 * 
 * EXCEPTIONS: 
 * - DIRECTOR (Unified oversight)
 * - PARENT (Can have wards in both campuses)
 */
export function requireCampus(campus: 'PRIMARY' | 'SECONDARY') {
  return (req: any, res: any, next: any) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    
    const role = req.user.role;
    // Cross-campus authorized roles
    if (role === 'DIRECTOR' || role === 'PARENT') return next();
    
    if (req.user.campus !== campus) {
      return res.status(403).json({ 
        error: `Access Denied. This resource is restricted to the ${campus} campus.` 
      });
    }
    next();
  };
}

/**
 * Sign a JWT and set it as an HttpOnly cookie.
 */
export function signAndSet(res: any, payload: any) {
  const expiresIn = (process.env.JWT_EXPIRES_IN as string) || '8h';
  const token = jwt.sign(payload, SECRET, { expiresIn });
  
  // Sync cookie maxAge with JWT expiresIn (Simplified parser)
  const maxAge = parseDurationToMs(expiresIn);

  res.cookie(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: maxAge,
  });
  return token;
}

function parseDurationToMs(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 8 * 60 * 60 * 1000; // Default 8h
  const value = parseInt(match[1]);
  const unit = match[2];
  const multipliers: any = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * (multipliers[unit] || 3600000);
}

export function clearCookie(res: any) {
  res.clearCookie(COOKIE, { httpOnly: true, sameSite: 'strict' });
}
