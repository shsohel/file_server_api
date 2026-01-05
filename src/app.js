const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const routes = require("./routes");
const path = require("path");
const errorHandler = require("./middlewares/error.middleware");

const app = express();

/**
 * ======================
 * Global Middlewares
 * ======================
 */

// Security headers
app.use(helmet());

// CORS (API only)
app.use(
  cors({
    origin: "*", // restrict in production if needed
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  })
);

// Request logging
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// app.use("/public", express.static(path.join(__dirname, "../uploads")));

app.use(
  "/public",
  express.static(path.join(__dirname, "../uploads"), {
    setHeaders: (res, path) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

// Body parsing
app.use(express.json({ limit: "3gb" }));
app.use(express.urlencoded({ extended: true, limit: "3gb" }));

/**
 * ======================
 * Routes
 * ======================
 */

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.use("/api/v1", routes);

/**
 * ======================
 * Error Handler (LAST)
 * ======================
 */

app.use(errorHandler);

module.exports = app;
