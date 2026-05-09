import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const spaces = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT!,
  region: process.env.DO_SPACES_REGION ?? "fra1",
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY!,
    secretAccessKey: process.env.DO_SPACES_SECRET!,
  },
  forcePathStyle: false,
});

const BUCKET = process.env.DO_SPACES_BUCKET!;

export async function uploadToSpaces(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  await spaces.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

// Derives the public CDN URL for an object in a public-read bucket folder.
// DO Spaces URL format: https://{bucket}.{region}.digitaloceanspaces.com/{key}
export function getPublicUrl(key: string): string {
  const endpoint = process.env.DO_SPACES_ENDPOINT!; // e.g. https://fra1.digitaloceanspaces.com
  const bucket = process.env.DO_SPACES_BUCKET!;
  return endpoint.replace('https://', `https://${bucket}.`) + '/' + key;
}

export async function createPresignedDownloadUrl(
  key: string,
  filename: string,
  expiresInSeconds = 60 * 60 * 24 * 7 // 7 days
): Promise<string> {
  return getSignedUrl(
    spaces,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${filename}"`,
    }),
    { expiresIn: expiresInSeconds }
  );
}
