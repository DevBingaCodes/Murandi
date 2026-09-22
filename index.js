// server.js
const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");

// Declare App
const app = express();

// Webhook Route (placed at the top for priority)
app.use("/murandi/v1/webhook", require("./routes/webhook"));

// Middleware setup
app.use(express.json());
app.use(cookieParser());

// CORS setup
const allowedOrigins = [
  "http://murandi-apartments.local",
  "http://localhost:5173",
  "http://localhost:5174",
  "https://murandi.skirill.org"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Load routes
app.use("/murandi/v1/auth", require("./routes/auth"));
app.use("/murandi/v1/verify", require("./routes/emailService"));
app.use("/murandi/v1/users", require("./routes/users"));
app.use("/murandi/v1/tenants", require("./routes/tenants"));
app.use("/murandi/v1/listings", require("./routes/listings"));
app.use("/murandi/v1/payments", require("./routes/payments"));
app.use("/murandi/v1/maintenance", require("./routes/maintenanceRequest"));
app.use("/murandi/v1/checkout", require("./routes/rentCheckout"));
app.use("/murandi/v1/reports", require("./routes/reports"));
app.use("/murandi/v1/receipts", require("./routes/receipts"));
app.use("/murandi/v1/notifications", require("./routes/notifications"));
app.use("/murandi/v1/password", require("./routes/password"));
app.use("/murandi/v1/metrics", require("./routes/metrics"))

// Start the server only if not in test environment
if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 5700;
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
}

// Export app for testing
module.exports = app;
