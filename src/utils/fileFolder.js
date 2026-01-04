const path = require("path");
const fs = require("fs");
exports.getFolderByMime = (mimetype) => {
  if (!mimetype) return "others";

  if (mimetype.startsWith("image/")) return "images";
  if (mimetype.startsWith("video/")) return "videos";
  if (mimetype.startsWith("audio/")) return "audios";

  if (
    mimetype === "application/pdf" ||
    mimetype.includes("word") ||
    mimetype.includes("excel") ||
    mimetype.includes("text")
  ) {
    return "docs";
  }

  if (mimetype === "application/zip") return "zips";

  return "others";
};

exports.moveFile = (oldPath, folder) => {
  const uploadsRoot = "uploads";
  const targetDir = path.join(uploadsRoot, folder);

  fs.mkdirSync(targetDir, { recursive: true });

  const newPath = path.join(targetDir, path.basename(oldPath));
  fs.renameSync(oldPath, newPath);

  return newPath;
};
