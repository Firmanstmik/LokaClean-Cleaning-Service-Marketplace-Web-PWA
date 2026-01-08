/**
 * API entrypoint for LokaClean.
 *
 * - Loads environment variables
 * - Ensures local upload directory exists (cloud-ready: swap storage provider later)
 * - Starts the Express server
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

import { createApp } from "./app";
import { env } from "./config/env";

// Ensure upload directory exists for local disk storage.
// In production you can swap this for S3/GCS by replacing the storage module,
// while keeping the DB string fields identical (ERD-compatible).
const uploadDirAbs = path.resolve(process.cwd(), env.UPLOAD_DIR);
if (!fs.existsSync(uploadDirAbs)) {
  fs.mkdirSync(uploadDirAbs, { recursive: true });
}

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`[lokaclean-api] listening on :${env.PORT} (${env.NODE_ENV})`);
});


