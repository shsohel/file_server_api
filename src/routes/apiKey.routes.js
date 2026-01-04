const express = require("express");

const { protect, authorize } = require("../middlewares/auth.middleware");
const {
  generateApiKey,
  regenerateApiKey,
} = require("../controllers/apikey.controller");

const router = express.Router();

router.use(protect);

router.post("/", authorize("admin", "client"), generateApiKey);
router.post("/rotate", authorize("client"), regenerateApiKey);

module.exports = router;
