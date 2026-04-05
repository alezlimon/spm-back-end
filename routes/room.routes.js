
const router = require("express").Router();
const Room = require("../models/Room.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const { sendError } = require("../utils/error-response");

// GET - Listar todas las habitaciones
router.get("/", (req, res, next) => {
  Room.find()
    .then((allRooms) => res.json(allRooms))
    .catch((err) => next(err));
});

// POST - Crear nueva habitación
router.post("/", isAuthenticated, (req, res, next) => {
  const { property, roomNumber, type, pricePerNight, description } = req.body;
  Room.create({ property, roomNumber, type, pricePerNight, description })
    .then((newRoom) => res.status(201).json(newRoom))
    .catch((err) => next(err));
});

// PATCH - Lógica circular de estados (La clave del CRM)
router.patch("/:roomId/status", isAuthenticated, async (req, res, next) => {
  const { roomId } = req.params;
  try {
    const room = await Room.findById(roomId);
    if (!room) return sendError(res, 404, "Room not found", "ROOM_NOT_FOUND");

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

// PUT - Editar datos generales
router.put("/:id", isAuthenticated, (req, res, next) => {
  Room.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .then((updatedRoom) => res.json(updatedRoom))
    .catch((err) => next(err));
});

// DELETE - Eliminar
router.delete("/:id", isAuthenticated, (req, res, next) => {
  Room.findByIdAndDelete(req.params.id)
    .then(() => res.status(204).send())
    .catch((err) => next(err));
});


const Booking = require("../models/Booking.model");
// GET /api/rooms/:id/bookings - Historial de reservas de una habitación
router.get("/:id/bookings", async (req, res, next) => {
  try {
    const bookings = await Booking.find({ room: req.params.id })
      .populate("guest");
    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

module.exports = router;