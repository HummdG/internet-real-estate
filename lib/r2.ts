import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const BUCKET = process.env.R2_BUCKET_NAME!;
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

export async function uploadBuffer(key: string, buffer: Buffer, contentType = "image/png"): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: key.startsWith("grid/master-") ? "public, max-age=31536000, immutable" : "public, max-age=3600",
    })
  );
  return `${R2_PUBLIC_URL}/${key}`;
}

export async function downloadBuffer(key: string): Promise<Buffer> {
  const response = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export const CURRENT_GRID_KEY = "grid/current.json";
export const BLANK_MASTER_KEY = "grid/master-blank.png";

export async function getCurrentMasterKey(): Promise<string | null> {
  try {
    const buf = await downloadBuffer(CURRENT_GRID_KEY);
    const json = JSON.parse(buf.toString());
    return json.key ?? null;
  } catch {
    return null;
  }
}

export async function setCurrentMasterKey(key: string): Promise<void> {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: CURRENT_GRID_KEY,
      Body: JSON.stringify({ key }),
      ContentType: "application/json",
      CacheControl: "no-cache, no-store",
    })
  );
}
