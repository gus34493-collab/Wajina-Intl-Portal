import { SignJWT, jwtVerify, JWTVerifyResult } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import prisma from './prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-for-development-core'
);

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
    .sign(JWT_SECRET);
}

export async function signRefreshToken(payload: { userId: string }): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTVerifyResult | null> {
  try {
    return await jwtVerify(token, JWT_SECRET);
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
    sameSite: 'lax',
    path: '/',
    maxAge: 2 * 60 * 60, // 2 hours
  });

  // Set Refresh Token (7d)
  cookieStore.set('wajina_refresh', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return { accessToken, refreshToken };
}

export async function destroySession() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('wajina_refresh')?.value;

  if (refreshToken) {
    // We don't hash here to find, we must find by userId or just clear cookies
    // For a cleaner logout, we would verify the refreshToken and then revoke it in DB
    const verified = await verifyToken(refreshToken);
    if (verified) {
       await prisma.refreshToken.updateMany({
         where: { userId: verified.payload.userId as string, revoked: false },
         data: { revoked: true }
       });
    }
  }

  cookieStore.delete('wajina_access');
  cookieStore.delete('wajina_refresh');
  cookieStore.delete('wajina_token'); // Clean up old token if exists
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
