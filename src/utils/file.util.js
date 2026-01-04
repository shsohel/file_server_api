const fs = require("fs");
const path = require("path");

/**
 * ======================
 * Check if file exists
 * ======================
 */
exports.exists = (filePath) => {
  return fs.existsSync(filePath);
};

/**
 * ======================
 * Delete a file safely
 * ======================
 */
exports.deleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
};

/**
 * ======================
 * Generate safe filename
 * ======================
 * @param {string} originalName
 */
exports.safeFileName = (originalName) => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1e9);
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext).replace(/\s+/g, "_");
  return `${baseName}_${timestamp}_${random}${ext}`;
};

/**
 * ======================
 * Get file size in MB
 * ======================
 */
exports.getFileSizeMB = (filePath) => {
  if (!fs.existsSync(filePath)) return 0;
  const stats = fs.statSync(filePath);
  return stats.size / 1024 / 1024; // in MB
};
