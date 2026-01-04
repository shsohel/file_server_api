const express = require("express");
const {
  getUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  filterUserSection,
  updateUserPassword,
  getUserBySlug,
  getUsersPost,
} = require("../controllers/user.controller");

const User = require("../models/User");

const advancedResults = require("../middlewares/advancedResults.middleware");
const { protect, authorize } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .post(
    advancedResults(User, null, filterUserSection),
    authorize("admin"),
    getUsersPost
  )
  .get(advancedResults(User), authorize("admin"), getUsers);

router.route("/new").post(authorize("admin"), createUser);
router
  .route("/update-user-password/:id")
  .put(authorize("admin"), updateUserPassword);

router
  .route("/:id")
  .get(authorize("admin"), getUser)
  .put(authorize("admin"), updateUser)
  .delete(authorize("admin"), deleteUser);
router.route("/slug/:slug").get(authorize("admin"), getUserBySlug);

module.exports = router;
