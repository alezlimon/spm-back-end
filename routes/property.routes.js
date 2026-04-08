const express = require("express");
const router = express.Router();
const Property = require("../models/Property.model");
const Room = require("../models/Room.model");
const Booking = require("../models/Booking.model");
const { sendError } = require("../utils/error-response");

function parseDateInput(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

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
// Optional query params: checkIn, checkOut
// If dates are provided, only truly available rooms are returned.
router.get("/:propertyId/rooms", async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { checkIn, checkOut } = req.query;

    const property = await Property.findById(propertyId);
    if (!property) {
      return sendError(res, 404, "Property not found", "PROPERTY_NOT_FOUND");
    }

    const rooms = await Room.find({ property: propertyId }).sort({ roomNumber: 1 });

    const parsedCheckIn = parseDateInput(checkIn);
    const parsedCheckOut = parseDateInput(checkOut);

    if (!checkIn || !checkOut) {
      return res.json(rooms);
    }

    if (!parsedCheckIn || !parsedCheckOut) {
      return sendError(
        res,
        400,
        "checkIn and checkOut must be valid dates",
        "PROPERTY_ROOMS_DATES_INVALID"
      );
    }

    if (parsedCheckOut <= parsedCheckIn) {
      return sendError(
        res,
        400,
        "checkOut must be after checkIn",
        "PROPERTY_ROOMS_DATE_RANGE_INVALID"
      );
    }

    const roomIds = rooms.map((room) => room._id);

    const overlappingBookings = await Booking.find({
      room: { $in: roomIds },
      status: { $in: ["Confirmed", "Checked-in"] },
      checkIn: { $lt: parsedCheckOut },
      checkOut: { $gt: parsedCheckIn }
    }).select("room");

    const blockedRoomIds = new Set(
      overlappingBookings.map((booking) => String(booking.room))
    );

    const availableRooms = rooms.filter(
      (room) => !blockedRoomIds.has(String(room._id))
    );

    res.json(availableRooms);
  } catch (err) {
    next(err);
  }
});

// GET /api/properties/:propertyId/overview - KPI overview for a property
router.get("/:propertyId/overview", async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    const property = await Property.findById(propertyId);
    if (!property) {
      return sendError(res, 404, "Property not found", "PROPERTY_NOT_FOUND");
    }

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
      departuresPending
    ] = await Promise.all([
      Booking.countDocuments({
        room: { $in: roomIds },
        status: "Checked-in",
        checkIn: { $gte: startOfDay, $lt: endOfDay }
      }),
      Booking.countDocuments({
        room: { $in: roomIds },
        status: "Confirmed",
        checkIn: { $gte: startOfDay, $lt: endOfDay }
      }),
      Booking.countDocuments({
        room: { $in: roomIds },
        status: "Checked-out",
        checkOut: { $gte: startOfDay, $lt: endOfDay }
      }),
      Booking.countDocuments({
        room: { $in: roomIds },
        status: "Checked-in",
        checkOut: { $gte: startOfDay, $lt: endOfDay }
      })
    ]);

    const occupiedRooms = rooms.filter((r) => r.status === "Occupied").length;
    const availableRooms = rooms.filter((r) => r.status === "Available").length;
    const dirtyRooms = rooms.filter((r) => r.status === "Dirty" || (r.status === "Available" && !r.isClean)).length;

    let occupancyPercent = 0;
    let operationalMode = "hotel";
    let unitStatus = null;

    if (property.propertyType === "villa") {
      operationalMode = "villa";

      const hasOccupiedRoom = rooms.some((r) => r.status === "Occupied");
      const hasDirtyRoom = rooms.some((r) => r.status === "Dirty" || (r.status === "Available" && !r.isClean));

      if (hasOccupiedRoom) {
        unitStatus = "Occupied";
        occupancyPercent = 100;
      } else if (hasDirtyRoom) {
        unitStatus = "Dirty";
        occupancyPercent = 0;
      } else {
        unitStatus = "Available";
        occupancyPercent = 0;
      }
    } else {
      occupancyPercent =
        totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
    }

    res.json({
      propertyType: property.propertyType || "hotel",
      operationalMode,
      arrivalsCompleted,
      arrivalsPending,
      departuresCompleted,
      departuresPending,
      occupancyPercent,
      availableRooms,
      occupiedRooms,
      dirtyRooms,
      totalRooms,
      unitStatus
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;