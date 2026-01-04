const fs = require("fs");
const path = require("path");

/**
 * ======================
 * Merge Chunks
 * ======================
 * @param {string} fileId - unique file identifier
 * @param {number} totalChunks - total number of chunks
 * @param {string} finalPath - path for the merged file
 */
exports.mergeChunks = async (fileId, totalChunks, outputPath) => {
  const chunkDir = path.join("uploads", "chunks", fileId);
  const writeStream = fs.createWriteStream(outputPath);

  for (let i = 0; i < totalChunks; i++) {
    const chunkPath = path.join(chunkDir, `chunk-${i}`);
    const data = fs.readFileSync(chunkPath);
    writeStream.write(data);
    fs.unlinkSync(chunkPath); // delete chunk after writing
  }

  writeStream.end();

  // Remove the chunk folder
  fs.rmdirSync(chunkDir, { recursive: true });
};
