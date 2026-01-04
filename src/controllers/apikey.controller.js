const ApiKey = require("../models/ApiKey");
const File = require("../models/File");
const { generateKey } = require("../utils");
const ErrorResponse = require("../utils/errorResponse");

/**
 * @desc    Generate API key (first time)
 * @route   POST /api/v1/api-keys
 * @access  Private (client, client-admin)
 */
exports.generateApiKey = async (req, res, next) => {
  const user = req.user;

  console.log(user);

  const existingKey = await ApiKey.findOne({
    owner: user.id,
    active: true,
  });

  if (existingKey) {
    return next(new ErrorResponse("Active API key already exists", 400));
  }

  const apiKey = await ApiKey.create({
    name: `${user.name} Default Key`,
    owner: user.id,
    key: generateKey(),
    scopes: ["files:read", "files:write"],
  });

  res.status(201).json({
    success: true,
    apiKey: apiKey.key, // ⚠️ show only once
  });
};

/**
 * @desc    Regenerate (rotate) API key
 * @route   POST /api/v1/api-keys/rotate
 * @access  Private (client, client-admin)
 */
exports.regenerateApiKeyOld = async (req, res, next) => {
  try {
    const user = req.user;

    // // Role check
    // if (!["client"].includes(user.role)) {
    //   return next(new ErrorResponse("Not allowed", 403));
    // }

    // Find existing API key
    const apiKey = await ApiKey.findOne({
      owner: user.id,
      active: true,
    });
    const files = await File.find({
      apiKey: apiKey._id,
    });

    if (!apiKey) {
      return next(new ErrorResponse("API key not found", 404));
    }

    // Rotate key (same document)
    apiKey.key = generateKey();
    apiKey.revokedAt = undefined;
    apiKey.lastUsedAt = null;

    await apiKey.save();

    res.status(200).json({
      success: true,
      message: "API key regenerated successfully",
      apiKey: apiKey.key, // ⚠️ SHOW ONLY ONCE
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Regenerate API key
 * @route   POST /api/v1/api-keys/rotate
 * @access  Private (client, client-admin)
 */
exports.regenerateApiKey = async (req, res, next) => {
  try {
    const user = req.user;

    console.log(user);

    // 1️⃣ Find all active API keys
    const oldKeys = await ApiKey.find({
      owner: user.id,
      active: true,
    }).select("_id");

    const oldKeyIds = oldKeys.map((k) => k._id);

    // 2️⃣ Deactivate old keys
    if (oldKeyIds.length > 0) {
      await ApiKey.updateMany(
        { _id: { $in: oldKeyIds } },
        {
          active: false,
          revokedAt: new Date(),
        }
      );
    }

    // 3️⃣ Create new API key
    const newKey = await ApiKey.create({
      name: `${user.name} Rotated Key`,
      owner: user.id,
      key: generateKey(),
      scopes: ["files:read", "files:write"],
      active: true,
    });

    if (!newKey) {
      return next(new ErrorResponse("Failed to create new API key", 500));
    }

    // 4️⃣ Update all files linked to old keys
    if (oldKeyIds.length > 0) {
      await File.updateMany(
        { apiKey: { $in: oldKeyIds } },
        { apiKey: newKey._id }
      );
    }

    // 5️⃣ Response
    res.status(201).json({
      success: true,
      message: "API key regenerated successfully",
      apiKey: newKey.key, // ⚠️ SHOW ONLY ONCE
    });
  } catch (error) {
    next(error);
  }
};
