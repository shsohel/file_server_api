const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema(
  {
    /**
     * ======================
     * Basic File Info
     * ======================
     */
    originalName: {
      type: String,
      required: true,
    },
    filename: { type: String, unique: true, index: true },

    mimetype: {
      type: String,
      required: true,
    },

    size: {
      type: Number,
      required: true,
    },

    /**
     * ======================
     * Storage Info
     * ======================
     */
    folder: {
      type: String,
      required: true, // images / documents / others
    },

    path: {
      type: String,
      required: true, // absolute or relative path
    },

    /**
     * ======================
     * Ownership & Access
     * ======================
     */
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    apiKey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApiKey",
      index: true,
    },

    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "private",
      index: true,
    },

    rolesAllowed: {
      type: [String],
      default: ["admin", "user"],
    },

    /**
     * ======================
     * Chunk Upload Info
     * ======================
     */
    isChunked: {
      type: Boolean,
      default: false,
    },

    totalChunks: {
      type: Number,
    },

    /**
     * ======================
     * Status
     * ======================
     */
    status: {
      type: String,
      enum: ["uploading", "completed", "failed"],
      default: "completed",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * ======================
 * Indexes
 * ======================
 */
// FileSchema.index({ filename: 1 });
// FileSchema.index({ uploadedBy: 1 });
FileSchema.index({ originalName: "text", filename: "text" });
FileSchema.index({ createdAt: -1 });

module.exports = mongoose.model("File", FileSchema);
