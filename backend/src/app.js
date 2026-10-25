
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const errorHandler = require("./middleware/errorHandler");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const reportRoutes = require("./routes/reportRoutes");
const moderationRoutes = require("./routes/moderationRoutes");
const safePlaceRoutes = require("./routes/safePlaceRoutes");
const routeRoutes = require("./routes/routeRoutes");
const contactRoutes = require("./routes/contactRoutes");
const profileRoutes = require("./routes/profileRoutes");
const sosRoutes = require("./routes/sosRoutes");
const liveSessionRoutes = require("./routes/liveSessionRoutes");

const app = express();

// =====================================
// Security Middleware
// =====================================

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

app.use(cors());

// =====================================
// Body Parsing Middleware
// Must be BEFORE API routes
// =====================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================
// Privacy-Safe HTTP Logging
// =====================================

// Avoid logging query parameters
// and request bodies.

morgan.token("safe-path", (req) => {
  return req.path;
});

app.use(
  morgan(":method :safe-path :status :response-time ms")
);

// =====================================
// Static Profile Uploads
// =====================================

app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);

// =====================================
// Health Check
// =====================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Nirapod Poth API is running",
    timestamp: new Date().toISOString(),
  });
});

// =====================================
// API Routes
// =====================================

app.use("/api/auth", authRoutes);

app.use("/api/reports", reportRoutes);

app.use("/api/live", liveSessionRoutes);

app.use("/api/moderation", moderationRoutes);

app.use("/api/safe-places", safePlaceRoutes);

app.use("/api/routes", routeRoutes);

app.use("/api/profile", profileRoutes);

app.use("/api/contacts", contactRoutes);

// US-14: Offline SOS Synchronization
app.use("/api/sos", sosRoutes);

// =====================================
// Global Error Handler
// Must be LAST
// =====================================

app.use(errorHandler);

module.exports = app;
