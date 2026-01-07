const multer = require("multer");
const path = require("path");
const fs = require("fs");

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "20971520"); // 20MB

/**
 * ======================
 * Helpers
 * ======================
 */
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * ======================
 * Storage Configuration
 * ======================
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let baseDir = "uploads";

    // chunk upload handling
    if (req.body?.fileId && req.body?.chunkIndex !== undefined) {
      baseDir = path.join("uploads", "chunks", req.body.fileId);
    } else if (file.mimetype.startsWith("image/")) {
      baseDir = path.join("uploads", "images");
    } else if (file.mimetype === "application/pdf") {
      baseDir = path.join("uploads", "docs");
    } else {
      baseDir = path.join("uploads", "others");
    }

    ensureDir(baseDir);
    cb(null, baseDir);
  },

  filename: (req, file, cb) => {
    // chunk file name = index
    if (req.body?.chunkIndex !== undefined) {
      return cb(null, String(req.body.chunkIndex));
    }

    const safeName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, safeName);
  },
});

/**
 * ======================
 * File Filter
 * ======================
 */
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    // =====================
    // Images
    // =====================
    "image/png",
    "image/gif",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/avif",

    // =====================
    // PDF
    // =====================
    "application/pdf",

    // =====================
    // Word Documents
    // =====================
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx

    // =====================
    // Excel Documents
    // =====================
    "application/vnd.ms-excel", // .xls
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx

    // =====================
    // Videos
    // =====================
    "video/mp4",
    "video/x-matroska", // .mkv
    "video/x-msvideo", // .avi
    "video/quicktime", // .mov
    "video/webm",

    // =====================
    // Chunk / Binary Uploads
    // =====================
    "application/octet-stream",
    // "application/zip",
    // "application/x-zip-compressed",
  ];

  const allowedExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".avif",
    ".gif",
    ".webp",
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".mp4",
    ".mkv",
    ".avi",
    ".mov",
    ".webm",

  ];

  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error(`File type not allowed: ${file.mimetype}`), false);
  }

  // if (!allowedExtensions.includes(ext)) {
  //   return cb(new Error(`File extension not allowed : ${file.ext}`), false);
  // }

  cb(null, true);
};

module.exports = fileFilter;

/**
 * ======================
 * Multer Instance
 * ======================
 */
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

module.exports = upload;
