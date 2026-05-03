import { SignJWT, jwtVerify } from 'jose';
import prisma from './prisma';

const SIGNING_SECRET = new TextEncoder().encode(
  process.env.SIGNING_SECRET || 'wajina-institutional-signing-authority-2026'
);

/**
 * GENERATE DIGITAL SEAL
 * Cryptographically seals a document or result record.
 */
export async function sealInstitutionalRecord({
  entityId,
  entityType,
  content,
  signerId,
  manualSignatureData
}: {
  entityId: string;
  entityType: 'RESULT' | 'ATTESTATION' | 'TESTIMONIAL';
  content: any;
  signerId: string;
  manualSignatureData?: string;
}) {
  // 1. Create a stable representation of the content for hashing
  const stableContent = JSON.stringify(content, Object.keys(content).sort());
  
  // 2. Generate a JWS (JSON Web Signature) payload
  const token = await new SignJWT({ 
    entityId, 
    entityType, 
    contentHash: stableContent,
    signerId 
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .sign(SIGNING_SECRET);

  // 3. Store in DigitalSignature registry
  const signature = await prisma.digitalSignature.create({
    data: {
      entityId,
      entityType,
      signatureHash: token,
      signatureData: manualSignatureData,
      signerId,
    },
  });

  return signature;
}

/**
 * VERIFY DIGITAL SEAL
 * Validates that a document has not been tampered with since issuance.
 */
export async function verifyRecordIntegrity(signatureHash: string, currentContent: any) {
  try {
    const verified = await jwtVerify(signatureHash, SIGNING_SECRET);
    const payload = verified.payload as any;

    const stableContent = JSON.stringify(currentContent, Object.keys(currentContent).sort());
    
    if (payload.contentHash !== stableContent) {
      return { valid: false, reason: 'Content tampering detected' };
    }

    return { valid: true, signerId: payload.signerId };
  } catch (err) {
    return { valid: false, reason: 'Invalid signature seal' };
  }
}
