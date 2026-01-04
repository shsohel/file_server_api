const fs = require("fs");
const path = require("path");
const File = require("../models/File");

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");
const TEMP_DIRS = ["extracted", "chunks"];

/**
 * Recursively list files
 */
const walk = (dir, files = []) => {
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    stat.isDirectory() ? walk(full, files) : files.push(full);
  }
  return files;
};

/**
 * Garbage cleaner
 */
exports.cleanup = async (req, res) => {
  const dryRun = req.query.dry === "true";

  const report = {
    orphanFiles: [],
    orphanRecords: [],
    tempFoldersRemoved: [],
  };

  /* ----------------------------------
   * 1. Orphan files (disk but no DB)
   * ---------------------------------- */
  const allFilesOnDisk = walk(UPLOAD_ROOT);
  const dbFiles = await File.find({}, "path").lean();
  const dbPathSet = new Set(dbFiles.map((f) => path.resolve(f.path)));

  for (const filePath of allFilesOnDisk) {
    if (!dbPathSet.has(path.resolve(filePath))) {
      report.orphanFiles.push(filePath);
      if (!dryRun) fs.unlinkSync(filePath);
    }
  }

  /* ----------------------------------
   * 2. Orphan DB records (DB but no file)
   * ---------------------------------- */
  for (const doc of dbFiles) {
    if (!fs.existsSync(doc.path)) {
      report.orphanRecords.push(doc.path);
      if (!dryRun) await File.deleteOne({ path: doc.path });
    }
  }

  /* ----------------------------------
   * 3. Remove temp folders
   * ---------------------------------- */
  for (const folder of TEMP_DIRS) {
    const dir = path.join(UPLOAD_ROOT, folder);
    if (fs.existsSync(dir)) {
      report.tempFoldersRemoved.push(dir);
      if (!dryRun) fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  res.json({
    success: true,
    dryRun,
    summary: {
      orphanFiles: report.orphanFiles.length,
      orphanRecords: report.orphanRecords.length,
      tempFoldersRemoved: report.tempFoldersRemoved.length,
    },
    details: report,
  });
};
