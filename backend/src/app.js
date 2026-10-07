const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const errorHandler = require("./middleware/errorHandler");

// Import routes
const authRoutes = require("./routes/authRoutes");
const reportRoutes = require("./routes/reportRoutes");
const safePlaceRoutes = require("./routes/safePlaceRoutes");
const routeRoutes = require("./routes/routeRoutes");
const contactRoutes = require("./routes/contactRoutes");
const profileRoutes = require("./routes/profileRoutes");

const app = express();

// =========================
// SECURITY MIDDLEWARE
// =========================

// Allow profile images to be loaded by frontend
// Frontend: localhost:5173
// Backend: localhost:5000
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

app.use(cors());

// =========================
// PARSING MIDDLEWARE
// =========================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// LOGGER
// =========================

app.use(morgan("dev"));

// =========================
// STATIC UPLOADS
// =========================

// Makes files inside backend/uploads accessible through:
// http://localhost:5000/uploads/...
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);

// =========================
// HEALTH CHECK
// =========================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Nirapod Poth API is running",
    timestamp: new Date().toISOString(),
  });
});

// =========================
// API ROUTES
// =========================

app.use("/api/auth", authRoutes);

app.use("/api/reports", reportRoutes);

app.use("/api/safe-places", safePlaceRoutes);

app.use("/api/routes", routeRoutes);

app.use("/api/profile", profileRoutes);

// Trusted Contacts
app.use("/api/contacts", contactRoutes);

// =========================
// ERROR HANDLER
// Must always be last
// =========================

app.use(errorHandler);

module.exports = app;