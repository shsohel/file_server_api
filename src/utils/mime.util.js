const mime = require("mime-types");

const getMimeType = (filePath) => {
  return mime.lookup(filePath) || "application/octet-stream";
};

module.exports = { getMimeType };
