const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking.model");

// Crear una reserva
const Room = require("../models/Room.model");

// Crear una reserva y actualizar el estado de la habitación
router.post("/", async (req, res, next) => {
  try {
    const booking = await Booking.create(req.body);
    // Cambiar el estado de la habitación a 'Occupied' automáticamente
    await Room.findByIdAndUpdate(booking.room, { status: "Occupied" });
    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
});

// Obtener todas las reservas (opcional, útil para Lu)
router.get("/", async (req, res, next) => {
  try {
    const bookings = await Booking.find().populate("room");
    res.json(bookings);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
