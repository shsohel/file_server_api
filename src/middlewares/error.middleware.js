const ErrorResponse = require("../utils/errorResponse");

/**
 * ======================
 * Error Handling Middleware
 * ======================
 */
module.exports = (err, req, res, next) => {
  console.error(err);

  // Default error
  let statusCode = 500;
  let message = "Internal Server Error";

  // Multer file upload errors
  if (err.name === "MulterError") {
    statusCode = 400;
    message = err.message;
  }
  ///Mongoose Validation Errors
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((val) => val.message);
    err = new ErrorResponse(message, 400);
  }
  ///Mongoose bad Object Id
  if (err.name === "CastError") {
    const message = `The Entry not found with id of ${err.value}`;
    err = new ErrorResponse(message, 404);
  }

  // Validation / custom errors
  if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 403;
    message = "Invalid or expired token";
  }

  // MongoDB duplicate key
  if (err.code && err.code === 11000) {
    statusCode = 400;
    message = "Duplicate key error";
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === "production" ? undefined : err.message,
  });
};
