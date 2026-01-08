const sharp = require("sharp");
const path = require("path");
const fs = require("fs/promises");
const allowed = [
  "image/",
  "application/octet-stream"
];
const compressKeepOriginalName = async (req, res, next) => {
  try {
    console.log({ mimetype: req.file.mimetype })
    console.log({ mimetype: req.file.mimetype })
    if (!req.file) return next();
    if (!allowed.some(type => req.file.mimetype.startsWith(type))) {
      return next();
    }

    const inputPath = req.file.path;

    // 👉 keep original name from req.file.originalname, remove extension
    const originalName = path.parse(req.file.originalname).name;
    const dir = path.dirname(inputPath);
    const outputPath = path.join(dir, `${originalName}.webp`);

    await sharp(inputPath)
      .resize({ width: 1024, withoutEnlargement: true })
      .webp({ quality: 70 })
      .toFile(outputPath);

    // 🔐 delete original file safely
    await fs.unlink(inputPath);

    const stats = await fs.stat(outputPath);

    // update req.file info
    req.file.path = outputPath;
    req.file.filename = `${originalName}.webp`;
    req.file.mimetype = "image/webp";
    req.file.size = stats.size;

    next();
  } catch (err) {
    console.error("❌ Compression (keep original name) error:", err);
    next(err);
  }
};

module.exports = compressKeepOriginalName;
