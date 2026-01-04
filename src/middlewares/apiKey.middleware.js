const ApiKey = require("../models/ApiKey");

module.exports = async (req, res, next) => {
  const key = req.headers["x-api-key"] || req.query.apiKey;

  if (!key) {
    return res.status(401).json({
      success: false,
      message: "API key is required",
    });
  }

  const apiKey = await ApiKey.findOne({
    key,
    active: true,
  }).populate("owner");

  if (!apiKey || !apiKey.owner || !apiKey.owner.isActive) {
    return res.status(401).json({
      success: false,
      message: "Invalid API key",
    });
  }

  apiKey.lastUsedAt = new Date();
  await apiKey.save();

  req.apiKey = apiKey;
  req.user = apiKey.owner;

  next();
};
