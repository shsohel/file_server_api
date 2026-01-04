const { verifyToken } = require("../config/jwt");
const ApiKey = require("../models/ApiKey");

/**
 * ======================
 * JWT Middleware
 * ======================
 */
module.exports = async (req, res, next) => {
  try {
    /* =========================
       1. API KEY AUTH
    ========================= */
    const apiKey = req.headers["x-api-key"];

    if (apiKey) {
      const key = await ApiKey.findOne({ key: apiKey, active: true });

      if (!key) {
        return res.status(401).json({
          success: false,
          message: "Invalid API key",
        });
      }

      req.user = { type: "api-key" };
      return next();
    }

    /* =========================
       2. JWT AUTH (Header or Query)
    ========================= */
    let token;

    // From Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Fallback to query param
    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing",
      });
    }

    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      return next();
    } catch (err) {
      return res.status(403).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  } catch (error) {
    next(error);
  }
};
