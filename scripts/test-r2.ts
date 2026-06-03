// scripts/test-r2.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";
dotenv.config();

const r2 = new S3Client({
    region: "auto",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
    },
});

// A minimal valid 1×1 red pixel JPEG (no external file needed)
const TINY_JPEG = Buffer.from(
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSF-vqq1zzYmHZ6kwB7RmPlVCJuPQdkSqjJZw&s"
);

async function main() {
    const bucket = process.env.R2_BUCKET_NAME!;
    const publicBase = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

    // 0. Verify bucket exists and is accessible
    console.log(`0️⃣  Checking bucket "${bucket}" exists...`);
    try {
        await r2.send(new HeadBucketCommand({ Bucket: bucket }));
        console.log(`✅ Bucket "${bucket}" found and accessible`);
    } catch (err: any) {
        const code = err?.name ?? err?.Code ?? err?.message;
        if (code === "NoSuchBucket" || err?.$metadata?.httpStatusCode === 404) {
            console.error(`❌ Bucket "${bucket}" does not exist in R2.`);
            console.error("   → Go to dash.cloudflare.com → R2 and create it.");
        } else if (err?.$metadata?.httpStatusCode === 403) {
            console.error(`❌ Access denied to bucket "${bucket}".`);
            console.error("   → Check your API token has 'Object Read & Write' permission.");
        } else {
            console.error("❌ HeadBucket failed:", code);
        }
        process.exit(1);
    }

    // 1. Upload a real JPEG image
    const imageKey = "test/r2-test-image.jpg";
    console.log(`\n1️⃣  Uploading test image → ${imageKey}`);
    await r2.send(new PutObjectCommand({
        Bucket: bucket,
        Key: imageKey,
        Body: TINY_JPEG,
        ContentType: "image/jpeg",
    }));
    console.log("✅ Image upload succeeded");

    if (publicBase) {
        console.log(`\n🌐 Open this URL in your browser to verify the image loads:`);
        console.log(`\n   ${publicBase}/${imageKey}\n`);
        // Wait for user to confirm before deleting
        await new Promise<void>((resolve) => {
            process.stdout.write("   Press ENTER to delete the test image and finish... ");
            process.stdin.once("data", () => resolve());
        });
    } else {
        console.log("\n⚠️  R2_PUBLIC_URL is not set — can't build a public URL to verify.");
    }

    // 2. Clean up
    console.log(`\n2️⃣  Cleaning up test image...`);
    await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: imageKey }));
    console.log("✅ Cleanup done");

    console.log("\n🎉 R2 is fully operational!");
}

main().catch((err) => {
    console.error("❌ R2 test failed:", err.message);
    process.exit(1);
});

