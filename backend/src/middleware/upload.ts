/**
 * Multer configuration for image uploads.
 *
 * - Stores files on local disk under `UPLOAD_DIR`
 * - Returns DB-friendly public paths like "/uploads/<filename>"
 *
 * Cloud-ready note:
 * You can later replace this with an S3/GCS uploader while keeping the DB fields
 * the same (strings). That preserves ERD compatibility.
 */

import crypto from "node:crypto";
import path from "node:path";
import multer from "multer";

import { env } from "../config/env";
import { HttpError } from "../utils/httpError";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve(process.cwd(), env.UPLOAD_DIR));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ext && ext.length <= 10 ? ext : "";
    cb(null, `${Date.now()}-${crypto.randomUUID()}${safeExt}`);
  }
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new HttpError(400, "Only image uploads are allowed"));
  }
  return cb(null, true);
}

export const imageUpload = multer({
  storage,
  fileFilter,
  limits: {
    // Keep the limit modest; increase later if needed.
    fileSize: 5 * 1024 * 1024
  }
});

export function toPublicUploadPath(filename: string) {
  return `/uploads/${filename}`;
}

export function fileToPublicPath(file: Express.Multer.File) {
  return toPublicUploadPath(file.filename);
}


