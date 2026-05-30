import { S3Client } from "@aws-sdk/client-s3";

if (!process.env.S3_ACCESS_KEY_ID) throw new Error("Missing S3_ACCESS_KEY_ID");
if (!process.env.S3_SECRET_KEY) throw new Error("Missing S3_SECRET_KEY");
if (!process.env.S3_ENDPOINT) throw new Error("Missing S3_ENDPOINT");

/**
 * S3-compatible client pointed at Cloudflare R2.
 * Import this singleton wherever you need to interact with R2.
 */
export const r2 = new S3Client({
  region: "auto", // required by the AWS SDK; ignored by R2
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});

/** Name of the R2 bucket, sourced from env. */
export const R2_BUCKET = process.env.R2_BUCKET_NAME ?? "";

/**
 * Base public URL for the bucket (e.g. a custom domain or the R2 public URL).
 * Used to build the final URL returned to the client after upload.
 */
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "";