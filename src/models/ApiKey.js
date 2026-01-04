const mongoose = require("mongoose");
const crypto = require("crypto");

const ApiKeySchema = new mongoose.Schema(
  {
    /**
     * ======================
     * Key Info
     * ======================
     */
    key: {
      type: String,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true, // e.g. "Web App", "Mobile App"
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      index: true,
    },

    /**
     * ======================
     * Permissions
     * ======================
     */
    scopes: {
      type: [String],
      default: ["files:read", "files:write"],
    },
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },
    expiresAt: Date,
    /**
     * ======================
     * Status
     * ======================
     */
    active: {
      type: Boolean,
      default: true,
    },

    revokedAt: {
      type: Date,
    },

    /**
     * ======================
     * Auditing
     * ======================
     */
    lastUsedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * ======================
 * Auto-generate API Key
 * ======================
 */
ApiKeySchema.pre("save", async function () {
  if (!this.key) {
    this.key = crypto.randomBytes(32).toString("hex");
  }
});
module.exports = mongoose.model("ApiKey", ApiKeySchema);
