/**
 * ======================
 * Role Middleware
 * ======================
 * Usage:
 * router.get("/admin", role("admin"), controller.someAction);
 */
module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(403).json({
          success: false,
          message: "User role not found",
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied: insufficient role",
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
