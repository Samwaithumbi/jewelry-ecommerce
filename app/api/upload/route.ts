import { NextRequest } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
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

