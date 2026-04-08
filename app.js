// ℹ️ Gets access to environment variables/settings
require("dotenv").config();

// ℹ️ Connects to the database
require("./db");

// Handles http requests
const express = require("express");

const app = express();

// Middleware
require("./config")(app);

// Routes
const indexRoutes = require("./routes/index.routes");
app.use("/api", indexRoutes);

const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);

const guestRoutes = require("./routes/guest.routes");
app.use("/api/guests", guestRoutes);

const roomRoutes = require("./routes/room.routes");
app.use("/api/rooms", roomRoutes);

const propertyRoutes = require("./routes/property.routes");
app.use("/api/properties", propertyRoutes);

const bookingRoutes = require("./routes/booking.routes");
app.use("/api/bookings", bookingRoutes);

// Error handling
require("./error-handling")(app);

module.exports = app;