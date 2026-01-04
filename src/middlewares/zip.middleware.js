const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: "uploads/zips",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  console.log("file", file.mimetype);
  if (
    file.mimetype !== "application/zip" &&
    file.mimetype !== "application/x-zip-compressed"
  ) {
    return cb(new Error("Only ZIP files allowed"), false);
  }
  cb(null, true);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 4024 * 1024 * 1024, // 1GB ZIP //4GB
  },
});
