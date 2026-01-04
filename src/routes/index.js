// routes/index.js
const express = require("express");
const router = express.Router();

// Import individual route files
const otp = require("./otp.routes");
const user = require("./user.routes");
const auth = require("./auth.routes");
const role = require("./role.routes");
const fileRoutes = require("./file.routes");
const apiKeyRoutes = require("./apiKey.routes");
const maintenance = require("./maintenance.routes");

// API routes
router.use("/api-keys", apiKeyRoutes);
router.use("/files", fileRoutes);

router.use("/maintenance", maintenance);

router.use("/auth", auth);
router.use("/otp", otp);
router.use("/user", user);
router.use("/role", role);

module.exports = router;
