import { SignJWT, jwtVerify, JWTVerifyResult } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import prisma from './prisma';

let _jwtSecret: Uint8Array | null = null;
function getJwtSecret(): Uint8Array {
  if (!_jwtSecret) {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET environment variable is not set. Server cannot start.");
    }
    _jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET);
  }
  return _jwtSecret;
}

const ACCESS_TOKEN_EXPIRY = '2h';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface UserPayload {
  userId: string;
  email: string;
  role: string;
  campus?: string;
}

/**
 * PASSWORD SECURITY
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12); // Standard institutional cost factor
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * TOKEN GENERATION
 */
export async function signAccessToken(payload: UserPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(getJwtSecret());
}

export async function signRefreshToken(payload: { userId: string }): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(getJwtSecret());
}

export async function verifyToken(token: string): Promise<JWTVerifyResult | null> {
  try {
    return await jwtVerify(token, getJwtSecret());
  } catch (err) {
    return null;
  }
}

/**
 * SESSION MANAGEMENT
 */
export async function createSession(user: any) {
  const payload: UserPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    campus: user.campus || undefined,
  };

  const accessToken = await signAccessToken(payload);
  const refreshToken = await signRefreshToken({ userId: user.id });

  // Store hashed refresh token in DB for rotation/revocation
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashedRefreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  const cookieStore = await cookies();
  
  // Set Access Token (2h)
  cookieStore.set('wajina_access', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 2 * 60 * 60, // 2 hours
  });

  // Compatibility Alias for legacy API routes
  cookieStore.set('wajina_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 2 * 60 * 60, 
  });

  // Set Refresh Token (7d)
  cookieStore.set('wajina_refresh', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return { accessToken, refreshToken };
}

export async function destroySession() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('wajina_refresh')?.value;

  if (refreshToken) {
    const verified = await verifyToken(refreshToken);
    if (verified) {
      const userId = verified.payload.userId as string;
      // Revoke only the specific token being surrendered — not all sessions for the user.
      // This preserves concurrent sessions (e.g. phone + laptop) on normal logout.
      const stored = await prisma.refreshToken.findMany({
        where: { userId, revoked: false },
        select: { id: true, tokenHash: true },
      });
      for (const t of stored) {
        if (await bcrypt.compare(refreshToken, t.tokenHash)) {
          await prisma.refreshToken.update({ where: { id: t.id }, data: { revoked: true } });
          break;
        }
      }
    }
  }

  cookieStore.delete('wajina_access');
  cookieStore.delete('wajina_refresh');
  cookieStore.delete('wajina_token');
}

/**
 * TOKEN ROTATION (Industry Standard)
 */
export async function rotateSession(refreshToken: string) {
  const verified = await verifyToken(refreshToken);
  if (!verified) throw new Error('Invalid refresh token');

  const userId = verified.payload.userId as string;

  // Find valid refresh tokens for this user
  const storedTokens = await prisma.refreshToken.findMany({
    where: { userId, revoked: false },
  });

  // Check if our current token's hash matches any in DB
  let validStoredToken = null;
  for (const stored of storedTokens) {
    const isMatch = await bcrypt.compare(refreshToken, stored.tokenHash);
    if (isMatch) {
      validStoredToken = stored;
      break;
    }
  }

  if (!validStoredToken) {
    // REPLAY ATTACK DETECTION
    // If a refresh token is reused, revoke ALL sessions for this user
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });
    throw new Error('Replay attack detected. Session revoked.');
  }

  // Revoke old token
  await prisma.refreshToken.update({
    where: { id: validStoredToken.id },
    data: { revoked: true },
  });

  // Issue new session
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  return createSession(user);
}
