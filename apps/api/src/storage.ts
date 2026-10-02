import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Credentials, endpoint and region come from the AWS_* vars Neon injects for the bucket.
const s3 = new S3Client({ forcePathStyle: true });
const Bucket = "storage";

/** Short-lived URL the browser can PUT a file to. */
export const uploadUrl = (key: string, contentType: string) =>
  getSignedUrl(s3, new PutObjectCommand({ Bucket, Key: key, ContentType: contentType }), { expiresIn: 600 });

/** Short-lived URL to read a private object. */
export const readUrl = (key: string) => getSignedUrl(s3, new GetObjectCommand({ Bucket, Key: key }), { expiresIn: 3600 });

export async function exists(key: string) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

export const put = (key: string, body: Uint8Array, contentType: string) =>
  s3.send(new PutObjectCommand({ Bucket, Key: key, Body: body, ContentType: contentType }));

export const remove = (key: string) => s3.send(new DeleteObjectCommand({ Bucket, Key: key })).catch(() => undefined);
