const path = require("path");
const fs = require("fs");
const fsp = fs.promises;
const sharp = require("sharp");

/**
 * Compress an image file to WebP while keeping the original name.
 * Skips compression if file is already a WebP with the same name.
 * Updates req.file with new path, filename, mimetype, and size.
 */
const compressKeepOriginalNameZip = async (req) => {
  if (!req.file) return;

  const inputPath = req.file.path;
  const ext = path.extname(inputPath).toLowerCase();

  // Only process image files
  if (!req.file.mimetype.startsWith("image/")) return;

  const dir = path.dirname(inputPath);
  const originalName = path.parse(req.file.filename).name;
  const outputPath = path.join(dir, `${originalName}.webp`);

  // Skip compression if file is already WebP with the same path
  if (ext === ".webp" && inputPath === outputPath) {
    return; // nothing to do
  }

  try {
    await sharp(inputPath)
      .resize({ width: 1024, withoutEnlargement: true })
      .webp({ quality: 70 })
      .toFile(outputPath);

    // Remove original file if it's different
    if (inputPath !== outputPath) {
      await fsp.unlink(inputPath);
    }

    const stats = await fsp.stat(outputPath);

    // Update req.file info
    req.file.path = outputPath;
    req.file.filename = `${originalName}.webp`;
    req.file.mimetype = "image/webp";
    req.file.size = stats.size;
  } catch (err) {
    console.error("❌ Error compressing file:", inputPath, err);
    // Optional: fail silently or throw depending on your workflow
  }
};

module.exports = compressKeepOriginalNameZip;
