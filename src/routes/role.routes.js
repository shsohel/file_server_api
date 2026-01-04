const express = require("express");
const {
  getRoles,
  getRole,
  updateRole,
  deleteRole,
  filterRoleSection,
  createRole,
} = require("../controllers/role.controller");

const Role = require("../models/Role");

const advancedResults = require("../middlewares/advancedResults.middleware");
const { protect, authorize } = require("../middlewares/auth.middleware");

const router = express.Router();
router.use(protect);
router.use(authorize("admin"));

router
  .route("/")
  .post(advancedResults(Role, [], filterRoleSection), getRoles)
  .get(advancedResults(Role), getRoles);

router.route("/new").post(createRole);

router.route("/:id").get(getRole).put(updateRole).delete(deleteRole);

module.exports = router;
