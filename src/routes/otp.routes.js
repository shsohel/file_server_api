const express = require("express");

const { sendOtp } = require("../controllers/otp.controller");

const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");

router.route("/").get(protect, sendOtp);

module.exports = router;
