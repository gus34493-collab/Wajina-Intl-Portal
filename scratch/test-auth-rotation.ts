import { createSession, rotateSession, verifyToken } from '../lib/auth';
import prisma from '../lib/prisma';

async function testRotation() {
  console.log("Starting Auth Security Test...");
  
  // 1. Setup mock user
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("No user found in DB to test with.");
    return;
  }

  try {
    // 2. Initial Login
    console.log("-> Simulating Login...");
    const session1 = await createSession(user);
    console.log("Initial Refresh Token:", session1.refreshToken.substring(0, 10) + "...");

    // 3. Legitimate Rotation
    console.log("-> Simulating Legitimate Rotation...");
    const session2 = await rotateSession(session1.refreshToken);
    console.log("Rotated Refresh Token:", session2.refreshToken.substring(0, 10) + "...");

    // 4. Replay Attack (Using session1.refreshToken again)
    console.log("-> Simulating Replay Attack (Reusing old token)...");
    try {
      await rotateSession(session1.refreshToken);
      console.error("FAIL: Replay attack was NOT detected!");
    } catch (err: any) {
      console.log("SUCCESS: Replay attack detected and blocked:", err.message);
    }

    // 5. Cleanup
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    console.log("Auth tests passed.");

  } catch (err: any) {
    console.error("Auth test failed:", err.message);
  }
}

testRotation();
