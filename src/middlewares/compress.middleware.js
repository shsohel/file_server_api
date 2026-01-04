const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const fsp = fs.promises;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Safely unlink a file, retrying if it's busy (Windows can lock files)
 */
const safeUnlink = async (filePath, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await fsp.unlink(filePath); // ✅ use promise-based unlink
      return;
    } catch (err) {
      if (err.code !== "EBUSY") throw err;
      await sleep(150);
    }
  }
};

/**
 * Compress images and convert to WebP
 */
const compressFile = async (req, res, next) => {
  try {
    if (!req.file) return next();
    if (!req.file.mimetype.startsWith("image/")) return next();

    const filePath = req.file.path;
    const ext = path.extname(filePath).toLowerCase();

    // Determine output path
    const outputFileName = path.basename(filePath, ext) + ".webp";
    const outputPath = path.join(path.dirname(filePath), outputFileName);

    // Skip if already WebP with the same name
    if (ext === ".webp" && filePath === outputPath) {
      return next();
    }

    // Compress and convert to WebP
    await sharp(filePath)
      .resize({ width: 1024, withoutEnlargement: true })
      .webp({ quality: 50 })
      .toFile(outputPath);

    await sleep(100); // allow Windows to release file lock

    if (filePath !== outputPath) await safeUnlink(filePath);

    const stats = await fsp.stat(outputPath);

    req.file.path = outputPath;
    req.file.filename = outputFileName;
    req.file.mimetype = "image/webp";
    req.file.size = stats.size;

    next();
  } catch (err) {
    console.error("❌ Compression/WebP error:", err);
    next(err);
  }
};

module.exports = compressFile;
