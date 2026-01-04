const router = require("express").Router();
const apiKeyMiddleware = require("../middlewares/apiKey.middleware");
const role = require("../middlewares/role.middleware");
const controller = require("../controllers/maintenance.controller");

// Clean garbage (admin only)
router.post("/cleanup", apiKeyMiddleware, controller.cleanup);

module.exports = router;
