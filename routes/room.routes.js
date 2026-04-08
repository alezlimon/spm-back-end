const router = require("express").Router();
const Room = require("../models/Room.model");
const Booking = require("../models/Booking.model");
const { isAuthenticated, requireAdmin } = require("../middleware/jwt.middleware");
const { sendError } = require("../utils/error-response");

// GET all rooms
router.get("/", async (req, res, next) => {
  try {
    const allRooms = await Room.find();
    res.json(allRooms);
  } catch (err) {
    next(err);
  }
});

// POST create room
router.post("/", isAuthenticated, requireAdmin, async (req, res, next) => {
  try {
    const { property, roomNumber, type, pricePerNight, description } = req.body;
    const newRoom = await Room.create({
      property,
      roomNumber,
      type,
      pricePerNight,
      description
    });
    res.status(201).json(newRoom);
  } catch (err) {
    next(err);
  }
});

// PATCH cycle room status
router.patch("/:roomId/status", isAuthenticated, requireAdmin, async (req, res, next) => {
  const { roomId } = req.params;

  try {
    const room = await Room.findById(roomId);

    if (!room) {
      return sendError(res, 404, "Room not found", "ROOM_NOT_FOUND");
    }

    let nextStatus = room.status;

    if (room.status === "Available") nextStatus = "Occupied";
    else if (room.status === "Occupied") nextStatus = "Dirty";
    else if (room.status === "Dirty") nextStatus = "Available";

    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      { status: nextStatus },
      { new: true }
    );

    res.json(updatedRoom);
  } catch (error) {
    next(error);
  }
});

// PUT update room
router.put("/:id", isAuthenticated, requireAdmin, async (req, res, next) => {
  try {
    const updatedRoom = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });

    if (!updatedRoom) {
      return sendError(res, 404, "Room not found", "ROOM_NOT_FOUND");
    }

    res.json(updatedRoom);
  } catch (err) {
    next(err);
  }
});

// DELETE room
router.delete("/:id", isAuthenticated, requireAdmin, async (req, res, next) => {
  try {
    const deletedRoom = await Room.findByIdAndDelete(req.params.id);

    if (!deletedRoom) {
      return sendError(res, 404, "Room not found", "ROOM_NOT_FOUND");
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// GET booking history for a room
router.get("/:id/bookings", async (req, res, next) => {
  try {
    const bookings = await Booking.find({ room: req.params.id }).populate("guest");
    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

module.exports = router;