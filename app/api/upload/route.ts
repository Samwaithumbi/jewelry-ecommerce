import { NextRequest } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";
import { randomUUID } from "crypto";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xFF, 0xD8, 0xFF],
  "image/png": [0x89, 0x50, 0x4E, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46], // RIFF
  "image/gif": [0x47, 0x49, 0x46, 0x38], // GIF8
};

function hasValidMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const sig = MAGIC_BYTES[mimeType];
  if (!sig) return true; // avif or other formats without simple static 3-4 byte prefix
  if (buffer.length < sig.length) return false;
  return sig.every((byte, i) => buffer[i] === byte);
}

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== "admin") {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return errorResponse("No file provided", 400);
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return errorResponse(
        `fileType must be one of: ${[...ALLOWED_TYPES].join(", ")}`,
        415
      );
    }

    if (file.size <= 0 || file.size > MAX_SIZE_BYTES) {
      return errorResponse(`File must be >0 and <${MAX_SIZE_BYTES / 1024 / 1024} MB`, 400);
    }

    if (!R2_BUCKET) {
      console.error("R2_BUCKET_NAME env variable is not set");
      return errorResponse("Server misconfiguration: storage bucket not configured", 500);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!hasValidMagicBytes(buffer, file.type)) {
      return errorResponse("File content does not match declared image type", 415);
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const key = `uploads/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: file.type,
      Body: buffer,
    });

    await r2.send(command);

    const publicUrl = R2_PUBLIC_URL
      ? `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`
      : null;

    return Response.json({ publicUrl, key }, { status: 200 });
  } catch (err) {
    console.error("Failed to upload:", err);
    return errorResponse("Failed to upload", 500);
  }
}

