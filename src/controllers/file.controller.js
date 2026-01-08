const path = require("path");
const fs = require("fs");
const fsp = fs.promises;
const File = require("../models/File");
const { mergeChunks } = require("../utils/chunk.util");
const archiver = require("archiver");
const unzipper = require("unzipper");
const { v4: uuid } = require("uuid");
const compressFile = require("../middlewares/compress.middleware");
const runMiddleware = require("../utils/runMiddleware");
const sharp = require("sharp");
const { getMimeType } = require("../utils/mime.util");
const { moveFile, getFolderByMime } = require("../utils/fileFolder");
const compressKeepOriginalName = require("../middlewares/compressKeepOriginalName.middleware");
const compressKeepOriginalNameZip = require("../middlewares/compressKeepOriginalNameZip.middleware");

/**rs
 * Parse and sanitize query params
 */
const parseIntParam = (v, fallback) => {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? fallback : n;
};

const parseDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};
/**
 * ======================
 * Single File Upload
 * ======================
 */
exports.upload = async (req, res, next) => {
  // console.log(req?.file);
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const newFile = await File.create({
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      folder: path.basename(req.file.destination),
      path: req.file.path,
      uploadedBy: req.apiKey?.owner?.id,
      apiKey: req.apiKey?._id,
      visibility: "private",
    });

    res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      file: newFile,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ======================
 * Chunk Upload
 * ======================
 */
exports.chunkUpload = async (req, res, next) => {
  try {
    const { fileId, totalChunks, chunkIndex } = req.body;

    if (!fileId || totalChunks === undefined || chunkIndex === undefined) {
      return res.status(400).json({
        success: false,
        message: "fileId, chunkIndex, and totalChunks are required",
      });
    }

    const chunkDir = path.join("uploads", "chunks", fileId);
    if (!fs.existsSync(chunkDir)) fs.mkdirSync(chunkDir, { recursive: true });

    // Move chunk to chunk folder
    if (req.file) {
      const chunkPath = path.join(chunkDir, `chunk-${chunkIndex}`);
      fs.renameSync(req.file.path, chunkPath);

      // Save metadata for first chunk
      if (chunkIndex === "0") {
        await File.create({
          filename: fileId,
          originalName: req.file.originalname,
          folder: "chunks",
          path: "",
          size: 0,
          mimetype: req.file.mimetype,
          uploadedBy: req.user?.id,
          apiKey: req.apiKey?._id,
          isChunked: true,
          totalChunks: parseInt(totalChunks),
          status: "uploading",
        });
      }
    }

    // Check if all chunks uploaded
    const uploadedChunks = fs.readdirSync(chunkDir).length;
    if (uploadedChunks >= parseInt(totalChunks)) {
      const finalPath = path.join(
        "uploads",
        "others",
        `${fileId}_${Date.now()}`
      );
      await mergeChunks(fileId, totalChunks, finalPath);

      const fileMeta = await File.findOne({ id: fileId });
      fileMeta.path = finalPath;
      fileMeta.status = "completed";
      fileMeta.size = fs.statSync(finalPath).size;
      await fileMeta.save();

      return res.status(201).json({
        success: true,
        message: "File uploaded & merged successfully",
        file: fileMeta,
      });
    }

    res.status(200).json({
      success: true,
      message: `Chunk ${chunkIndex} uploaded successfully`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ======================
 * Download File
 * ======================
 */
exports.download = async (req, res, next) => {
  try {
    const { id } = req.params;

    const file = await File.findById(id);

    console.log(file);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    /**
     * ============================
     * Authorization Check
     * ============================
     */

    // Case 1: API Key based access
    if (req.apiKey) {
      if (
        !file.apiKey ||
        file.apiKey.toString() !== req.apiKey._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "API key not authorized for this file",
        });
      }
    }

    // Case 2: JWT based access
    // if (req.user) {
    //   if (
    //     file.uploadedBy &&
    //     file.uploadedBy.toString() !== req.user._id.toString()
    //   ) {
    //     return res.status(403).json({
    //       success: false,
    //       message: "You do not own this file",
    //     });
    //   }
    // }

    /**
     * ============================
     * File Exists Check
     * ============================
     */
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({
        success: false,
        message: "File missing on disk",
      });
    }

    /**
     * ============================
     * Send File
     * ============================
     */
    // console.log(file.path);
    // console.log(file.filename);
    // console.log(path.basename(file.path));
    res.download(file.path, file.filename || path.basename(file.path));
  } catch (err) {
    next(err);
  }
};

exports.deleteFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    /**
     * ============================
     * Authorization
     * ============================
     */

    // API key authorization
    if (req.apiKey) {
      if (
        !file.apiKey ||
        file.apiKey.toString() !== req.apiKey._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "API key not authorized to delete this file",
        });
      }
    }

    // JWT authorization
    // if (req.user) {
    //   if (
    //     file.uploadedBy &&
    //     file.uploadedBy.toString() !== req.user._id.toString()
    //   ) {
    //     return res.status(403).json({
    //       success: false,
    //       message: "You do not own this file",
    //     });
    //   }
    // }

    /**
     * ============================
     * Delete File from Disk
     * ============================
     */
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    /**
     * ============================
     * Delete Chunk Folder (if any)
     * ============================
     */
    if (file.isChunked) {
      const chunkDir = path.join("uploads", "chunks", file.filename);
      if (fs.existsSync(chunkDir)) {
        fs.rmSync(chunkDir, { recursive: true, force: true });
      }
    }

    /**
     * ============================
     * Remove DB Record
     * ============================
     */
    await file.deleteOne();

    res.status(200).json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

exports.bulkDownload = async (req, res, next) => {
  try {
    const { fileIds } = req.body;

    if (!Array.isArray(fileIds) || !fileIds.length) {
      return res.status(400).json({
        success: false,
        message: "fileIds array required",
      });
    }

    const files = await File.find({
      _id: { $in: fileIds },
      deletedAt: null,
    });

    if (!files.length) {
      return res.status(404).json({
        success: false,
        message: "No files found",
      });
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=files.zip");

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    for (const file of files) {
      if (fs.existsSync(file.path)) {
        archive.file(file.path, {
          name: file.filename || file.originalName,
        });
      }
    }

    await archive.finalize();
  } catch (err) {
    next(err);
  }
};

exports.bulkDelete = async (req, res, next) => {
  try {
    const { fileIds } = req.body;

    if (!Array.isArray(fileIds)) {
      return res.status(400).json({
        success: false,
        message: "fileIds must be array",
      });
    }

    await File.updateMany(
      { _id: { $in: fileIds }, deletedAt: null },
      { deletedAt: new Date() }
    );

    res.json({
      success: true,
      message: "Files soft-deleted",
    });
  } catch (err) {
    next(err);
  }
};
exports.restoreFiles = async (req, res, next) => {
  try {
    const { fileIds } = req.body;

    if (!Array.isArray(fileIds)) {
      return res.status(400).json({
        success: false,
        message: "fileIds must be array",
      });
    }

    const result = await File.updateMany(
      { _id: { $in: fileIds }, deletedAt: { $ne: null } },
      { deletedAt: null }
    );

    res.json({
      success: true,
      restored: result.modifiedCount,
    });
  } catch (err) {
    next(err);
  }
};

// exports.uploadZip = async (req, res, next) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "ZIP file required",
//       });
//     }

//     const extractId = uuid();
//     const extractDir = path.join("uploads", "extracted", extractId);
//     fs.mkdirSync(extractDir, { recursive: true });

//     /** Extract ZIP safely */
//     await fs
//       .createReadStream(req.file.path)
//       .pipe(unzipper.Extract({ path: extractDir }))
//       .promise();

//     const files = [];
//     const walk = async (dir) => {
//       for (const item of fs.readdirSync(dir)) {
//         const fullPath = path.join(dir, item);
//         const stat = fs.statSync(fullPath);

//         if (stat.isDirectory()) {
//           await walk(fullPath);
//         } else {
//           files.push(fullPath);
//         }
//       }
//     };

//     await walk(extractDir);

//     const savedFiles = [];

//     for (const filePath of files) {
//       const ext = path.extname(filePath);
//       const isImage = [".jpg", ".jpeg", ".png"].includes(ext.toLowerCase());

//       let finalPath = filePath;
//       let mimetype = "application/octet-stream";

//       if (isImage) {
//         const webpPath = filePath.replace(ext, ".webp");

//         await sharp(filePath)
//           .resize({ width: 1920, withoutEnlargement: true })
//           .webp({ quality: 80 })
//           .toFile(webpPath);

//         fs.unlinkSync(filePath);
//         finalPath = webpPath;
//         mimetype = "image/webp";
//       }

//       const stats = fs.statSync(finalPath);

//       const saved = await File.create({
//         filename: path.basename(finalPath),
//         originalName: path.basename(finalPath),
//         path: finalPath,
//         size: stats.size,
//         mimetype,
//         apiKey: req.apiKey._id,
//       });

//       savedFiles.push(saved);
//     }

//     /** Cleanup zip */
//     fs.unlinkSync(req.file.path);

//     res.status(201).json({
//       success: true,
//       totalFiles: savedFiles.length,
//       files: savedFiles,
//     });
//   } catch (err) {
//     next(err);
//   }
// };
exports.uploadZip = async (req, res, next) => {
  const zipPath = req.file?.path;
  const extractId = uuid();
  const extractDir = path.join("uploads", "extracted", extractId);

  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "ZIP file required" });
    }

    await fsp.mkdir(extractDir, { recursive: true });

    // Extract ZIP
    await new Promise((resolve, reject) => {
      fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: extractDir }))
        .on("close", resolve)
        .on("error", reject);
    });

    // Walk extracted directory
    const extractedFiles = [];
    const walk = (dir) => {
      for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) walk(full);
        else extractedFiles.push(full);
      }
    };
    walk(extractDir);

    const savedFiles = [];

    for (const filePath of extractedFiles) {
      const stats = fs.statSync(filePath);
      const mimetype = getMimeType(filePath);

      const fakeReq = {
        file: {
          path: filePath,
          filename: path.basename(filePath),
          mimetype,
          size: stats.size,
        },
      };

      // Only compress if image
      if (mimetype.startsWith("image/")) {
        await runMiddleware(fakeReq, {}, compressFile);
      }

      // Determine final folder & move file
      const folder = getFolderByMime(fakeReq.file.mimetype);
      const finalPath = moveFile(fakeReq.file.path, folder);
      const finalStats = fs.statSync(finalPath);

      // Save metadata
      const saved = await File.create({
        filename: path.basename(finalPath),
        originalName: fakeReq.file.filename,
        folder,
        path: finalPath,
        size: finalStats.size,
        mimetype: fakeReq.file.mimetype,
        apiKey: req.apiKey?._id,
        uploadedBy: req.user?._id,
        source: "zip",
      });

      savedFiles.push(saved);
    }

    return res.status(201).json({
      success: true,
      totalFiles: savedFiles.length,
      files: savedFiles,
    });
  } catch (err) {
    return next(err);
  } finally {
    (async () => {
      try {
        if (zipPath && fs.existsSync(zipPath))
          await fsp.unlink(zipPath).catch(() => {});
      } catch (e) {
        console.error("Failed to remove uploaded zip:", e);
      }
      try {
        if (extractDir && fs.existsSync(extractDir))
          await fsp
            .rm(extractDir, { recursive: true, force: true })
            .catch(() => {});
      } catch (e) {
        console.error("Failed to remove extract directory:", e);
      }
    })();
  }
};

///Original File
exports.uploadOriginalZip = async (req, res, next) => {
  const zipPath = req.file?.path;
  const extractId = uuid();
  const extractDir = path.join("uploads", "extracted", extractId);

  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "ZIP file required" });
    }

    await fsp.mkdir(extractDir, { recursive: true });

    await new Promise((resolve, reject) => {
      fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: extractDir }))
        .on("close", resolve)
        .on("error", reject);
    });

    const extractedFiles = [];
    const walk = (dir) => {
      for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) walk(full);
        else extractedFiles.push(full);
      }
    };
    walk(extractDir);

    const savedFiles = [];

    for (const filePath of extractedFiles) {
      const stats = fs.statSync(filePath);

      const fakeReq = {
        file: {
          path: filePath,
          filename: path.basename(filePath),
          mimetype: getMimeType(filePath),
          size: stats.size,
        },
      };

      // Compress image if it's an image (keeping original name)
      await compressKeepOriginalNameZip(fakeReq);

      // Determine final folder and move file there
      const folder = getFolderByMime(fakeReq.file.mimetype);
      const finalPath = moveFile(fakeReq.file.path, folder);
      const finalStats = fs.statSync(finalPath);

      const saved = await File.create({
        filename: path.basename(finalPath),
        originalName: path.parse(fakeReq.file.filename).name, // keep original name without extension
        folder,
        path: finalPath,
        size: finalStats.size,
        mimetype: fakeReq.file.mimetype,
        apiKey: req.apiKey?._id,
        uploadedBy: req.user?._id,
        source: "zip",
      });

      savedFiles.push(saved);
    }

    return res.status(201).json({
      success: true,
      totalFiles: savedFiles.length,
      files: savedFiles,
    });
  } catch (err) {
    return next(err);
  } finally {
    (async () => {
      try {
        if (zipPath && fs.existsSync(zipPath)) {
          await fsp.unlink(zipPath).catch(() => {});
        }
      } catch (e) {
        console.error("Failed to remove uploaded zip:", e);
      }

      try {
        if (extractDir && fs.existsSync(extractDir)) {
          await fsp
            .rm(extractDir, { recursive: true, force: true })
            .catch(() => {});
        }
      } catch (e) {
        console.error("Failed to remove extract directory:", e);
      }
    })();
  }
};
/**
 * Download multiple files as ZIP
 * Query params: ids[]=fileId1&ids[]=fileId2
 * If no ids provided, downloads ALL files accessible via API key
 */
exports.downloadZipAll = async (req, res, next) => {
  try {
    // Get requested file IDs or fetch all
    let files = [];
    if (req.query.ids && Array.isArray(req.query.ids)) {
      files = await File.find({
        _id: { $in: req.query.ids },
        apiKey: req.apiKey._id,
      }).lean();
    } else {
      // all files for API key
      files = await File.find({ apiKey: req.apiKey._id }).lean();
    }

    if (!files.length) {
      return res.status(404).json({
        success: false,
        message: "No files found for download",
      });
    }

    // Set ZIP response headers
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename=files.zip`);

    // Create archive
    const archive = archiver("zip", { zlib: { level: 9 } });

    // Pipe archive data to response
    archive.pipe(res);

    // Append files to archive
    for (const file of files) {
      if (fs.existsSync(file.path)) {
        archive.file(file.path, { name: file.originalName || file.filename });
      }
    }

    // Finalize the archive
    await archive.finalize();
  } catch (err) {
    next(err);
  }
};

/**
 * Public download multiple files as ZIP
 * Query params: ids[]=fileId1&ids[]=fileId2
 * If no ids provided, downloads ALL files (careful: large!)
 */
exports.downloadZipPublic = async (req, res, next) => {
  try {
    let files = [];
    if (req.query.ids && Array.isArray(req.query.ids)) {
      files = await File.find({ _id: { $in: req.query.ids } }).lean();
    } else {
      // all files
      files = await File.find({}).lean();
    }

    if (!files.length) {
      return res.status(404).json({
        success: false,
        message: "No files found for download",
      });
    }

    // Set ZIP response headers
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=files-public.zip`
    );

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    for (const file of files) {
      if (fs.existsSync(file.path)) {
        archive.file(file.path, { name: file.originalName || file.filename });
      }
    }

    await archive.finalize();
  } catch (err) {
    next(err);
  }
};

/**
 * Protected listing (full features)
 * Requires apiKey middleware (or JWT) so req.apiKey / req.user may be available.
 */
exports.listFiles = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      q,
      folder,
      mimetype,
      minSize,
      maxSize,
      uploadedBy,
      visibility,
      startDate,
      endDate,
      sort,
      fields,
    } = req.query;

    // (async () => {
    //   await File.syncIndexes();
    //   console.log("✅ File indexes synced");
    // })();
    const pageNum = Math.max(1, parseIntParam(page, 1));
    const perPage = Math.min(500, Math.max(1, parseIntParam(limit, 20)));
    const skip = (pageNum - 1) * perPage;

    // Build filters
    const filters = {};

    // Scope by API key if present (protects multi-tenant)
    if (req.apiKey && req.apiKey._id) {
      filters.apiKey = req.apiKey._id;
    }

    if (folder) filters.folder = folder;
    if (mimetype) filters.mimetype = mimetype;
    if (visibility) filters.visibility = visibility;

    if (uploadedBy && mongoose.Types.ObjectId.isValid(uploadedBy)) {
      filters.uploadedBy = uploadedBy;
    }

    if (minSize || maxSize) {
      filters.size = {};
      if (minSize) filters.size.$gte = parseIntParam(minSize, 0);
      if (maxSize)
        filters.size.$lte = parseIntParam(maxSize, Number.MAX_SAFE_INTEGER);
    }

    const sd = parseDate(startDate);
    const ed = parseDate(endDate);
    if (sd || ed) {
      filters.createdAt = {};
      if (sd) filters.createdAt.$gte = sd;
      if (ed) filters.createdAt.$lte = ed;
    }

    // Search: prefer text search if index exists
    let findQuery;
    if (q) {
      // Using text search
      findQuery = File.find({ $text: { $search: q }, ...filters });
      // Add text score sorting if no explicit sort
      if (!sort)
        findQuery = findQuery
          .sort({ score: { $meta: "textScore" } })
          .select({ score: { $meta: "textScore" } });
    } else {
      findQuery = File.find(filters);
    }

    // Sorting
    if (sort) {
      // Example: sort=-createdAt,size
      const sortObj = {};
      sort.split(",").forEach((s) => {
        s = s.trim();
        if (!s) return;
        if (s.startsWith("-")) sortObj[s.slice(1)] = -1;
        else sortObj[s] = 1;
      });
      findQuery = findQuery.sort(sortObj);
    } else if (!q) {
      // default sort
      findQuery = findQuery.sort({ createdAt: -1 });
    }

    // Field projection
    if (fields) {
      const projection = fields
        .split(",")
        .map((f) => f.trim())
        .join(" ");
      findQuery = findQuery.select(projection);
    }

    // Pagination & execution
    const [total, items] = await Promise.all([
      File.countDocuments(q ? { $text: { $search: q }, ...filters } : filters),
      findQuery.skip(skip).limit(perPage).lean(),
    ]);

    const totalPages = Math.ceil(total / perPage);

    res.json({
      success: true,
      meta: {
        total,
        page: pageNum,
        perPage,
        totalPages,
      },
      data: items,
    });
  } catch (err) {
    next(err);
  }
};
