const express = require("express");
const router = express.Router();
const Property = require("../models/Property.model");
const Room = require("../models/Room.model");
const Booking = require("../models/Booking.model");
const { sendError } = require("../utils/error-response");

// GET /api/properties - List all properties
router.get("/", async (req, res, next) => {
  try {
    const properties = await Property.find();
    res.json(properties);
  } catch (err) {
    next(err);
  }
});

// GET /api/properties/:propertyId - Get single property detail
router.get("/:propertyId", async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.propertyId);
    if (!property) {
      return sendError(res, 404, "Property not found", "PROPERTY_NOT_FOUND");
    }
    res.json(property);
  } catch (err) {
    next(err);
  }
});

// GET /api/properties/:propertyId/rooms - List rooms scoped to a property
router.get("/:propertyId/rooms", async (req, res, next) => {
  try {
    const rooms = await Room.find({ property: req.params.propertyId });
    res.json(rooms);
  } catch (err) {
    next(err);
  }
});

// GET /api/properties/:propertyId/overview - KPI overview for a property
router.get("/:propertyId/overview", async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    const rooms = await Room.find({ property: propertyId });
    if (!rooms.length) {
      return sendError(
        res,
        404,
        "No rooms found for this property",
        "PROPERTY_ROOMS_NOT_FOUND"
      );
    }

    const roomIds = rooms.map((r) => r._id);
    const totalRooms = rooms.length;

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const [
      arrivalsCompleted,
      arrivalsPending,
      departuresCompleted,
      departuresPending,
    ] = await Promise.all([
      // Arrivals completed: checked-in today
      Booking.countDocuments({
        room: { $in: roomIds },
        status: "Checked-in",
        checkIn: { $gte: startOfDay, $lt: endOfDay },
      }),
      // Arrivals pending: confirmed, arriving today but not yet checked in
      Booking.countDocuments({
        room: { $in: roomIds },
        status: "Confirmed",
        checkIn: { $gte: startOfDay, $lt: endOfDay },
      }),
      // Departures completed: checked-out today
      Booking.countDocuments({
        room: { $in: roomIds },
        status: "Checked-out",
        checkOut: { $gte: startOfDay, $lt: endOfDay },
      }),
      // Departures pending: still checked-in but checkout is today
      Booking.countDocuments({
        room: { $in: roomIds },
        status: "Checked-in",
        checkOut: { $gte: startOfDay, $lt: endOfDay },
      }),
    ]);

    const occupiedRooms = rooms.filter((r) => r.status === "Occupied").length;
    const availableRooms = rooms.filter((r) => r.status === "Available").length;
    const occupancyPercent =
      totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    res.json({
      arrivalsCompleted,
      arrivalsPending,
      departuresCompleted,
      departuresPending,
      occupancyPercent,
      availableRooms,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
