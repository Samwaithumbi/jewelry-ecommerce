import type { NextRequest } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";
import { randomUUID } from "crypto";

// ─── Config ───────────────────────────────────────────────────────────────────

/** Allowed MIME types for image uploads. */
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

/** Maximum file size: 10 MB */
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

/** Presigned URL validity window (seconds). */
const URL_EXPIRES_IN = 60; // 1 minute

// ─── Helpers ──────────────────────────────────────────────────────────────────

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

// ─── Route handler ────────────────────────────────────────────────────────────

/**
 * POST /api/upload
 *
 * Request body (JSON):
 *   { fileName: string; fileType: string; fileSize: number }
 *
 * Success response (200):
 *   {
 *     presignedUrl: string  – PUT to this URL directly from the browser
 *     publicUrl:    string  – final URL of the uploaded file
 *     key:          string  – R2 object key
 *   }
 */
export async function POST(request: NextRequest) {
  // ── 1. Parse body ──────────────────────────────────────────────────────────
  let body: { fileName?: unknown; fileType?: unknown; fileSize?: unknown };
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const { fileName, fileType, fileSize } = body;

  // ── 2. Validate inputs ─────────────────────────────────────────────────────
  if (typeof fileName !== "string" || !fileName.trim()) {
    return errorResponse("fileName is required and must be a non-empty string", 400);
  }

  if (typeof fileType !== "string" || !ALLOWED_TYPES.has(fileType)) {
    return errorResponse(
      `fileType must be one of: ${[...ALLOWED_TYPES].join(", ")}`,
      415
    );
  }

  if (typeof fileSize !== "number" || fileSize <= 0) {
    return errorResponse("fileSize must be a positive number (bytes)", 400);
  }

  if (fileSize > MAX_SIZE_BYTES) {
    return errorResponse(
      `File too large. Maximum allowed size is ${MAX_SIZE_BYTES / 1024 / 1024} MB`,
      413
    );
  }

  if (!R2_BUCKET) {
    console.error("R2_BUCKET_NAME env variable is not set");
    return errorResponse("Server misconfiguration: storage bucket not configured", 500);
  }

  // ── 3. Build a unique object key ───────────────────────────────────────────
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "bin";
  const key = `uploads/${randomUUID()}.${ext}`;

  // ── 4. Generate presigned PUT URL ──────────────────────────────────────────
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: fileType,
    ContentLength: fileSize,
  });

  let presignedUrl: string;
  try {
    presignedUrl = await getSignedUrl(r2, command, { expiresIn: URL_EXPIRES_IN });
  } catch (err) {
    console.error("Failed to generate presigned URL:", err);
    return errorResponse("Failed to generate upload URL", 500);
  }

  // ── 5. Build final public URL ──────────────────────────────────────────────
  const publicUrl = R2_PUBLIC_URL
    ? `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`
    : null; // null if public URL not configured yet

  // ── 6. Return ──────────────────────────────────────────────────────────────
  return Response.json(
    { presignedUrl, publicUrl, key },
    { status: 200 }
  );
}
