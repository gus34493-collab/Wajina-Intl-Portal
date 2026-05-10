import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const storageClient = new S3Client({
  region: process.env.AWS_S3_REGION || "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "fallback-for-build-only",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "fallback-for-build-only",
  },
});

const BUCKET = process.env.AWS_S3_BUCKET || "fallback-for-build-only";

export async function uploadToStorage(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  await storageClient.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export function getPublicUrl(key: string): string {
  const region = process.env.AWS_S3_REGION || "eu-north-1";
  return `https://${BUCKET}.s3.${region}.amazonaws.com/${key}`;
}

export async function createPresignedDownloadUrl(
  key: string,
  filename: string,
  expiresInSeconds = 60 * 60 * 24 * 7 // 7 days
): Promise<string> {
  return getSignedUrl(
    storageClient,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${filename}"`,
    }),
    { expiresIn: expiresInSeconds }
  );
}

export async function deleteFromStorage(key: string): Promise<void> {
  await storageClient.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
