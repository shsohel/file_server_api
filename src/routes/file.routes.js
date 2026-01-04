const router = require("express").Router();
const upload = require("../config/multer");
const controller = require("../controllers/file.controller");
const apiKeyMiddleware = require("../middlewares/apiKey.middleware");

const jwt = require("../middlewares/jwt.middleware");
const role = require("../middlewares/role.middleware");
const compressFile = require("../middlewares/compress.middleware");
const uploadZip = require("../middlewares/zip.middleware");
const compressKeepOriginalName = require("../middlewares/compressKeepOriginalName.middleware");

// Public ZIP download (no auth)
router.get("/public-download-zip", controller.downloadZipPublic);
/**
 * ======================
 * Global Middlewares
 * ======================
 */
router.use(apiKeyMiddleware); // system-level access
router.use(jwt); // user authentication

/**
 * ======================
 * Routes
 * ======================
 */

router.get("/", apiKeyMiddleware, controller.listFiles);
router.post(
  "/upload-api",
  apiKeyMiddleware,
  upload.single("file"),
  compressKeepOriginalName,
  controller.upload
);

// Chunk upload for large files
router.post(
  "/chunk",
  apiKeyMiddleware,
  // role("admin"),
  upload.single("chunk"),
  compressFile,
  controller.chunkUpload
);
// Single file upload
router.post(
  "/upload",
  role("admin", "user"),
  upload.single("file"),
  controller.upload
);

// Download a file
// router.get("/:id", apiKeyMiddleware, controller.download).delete(
//   "/:id",
//   apiKeyMiddleware, // or jwtMiddleware (API key only also allowed)
//   controller.deleteFile
// );

router.get("/download-zip", apiKeyMiddleware, controller.downloadZipAll);

router
  .route("/:id", apiKeyMiddleware)
  .get(controller.download)
  .delete(controller.deleteFile);

router.post("/bulk/download", apiKeyMiddleware, controller.bulkDownload);

router.delete("/bulk/delete", apiKeyMiddleware, controller.bulkDelete);

router.post("/restore", apiKeyMiddleware, controller.restoreFiles);

router.post(
  "/upload-zip",
  apiKeyMiddleware,
  uploadZip.single("zip"),
  controller.uploadOriginalZip
);

module.exports = router;
