const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking.model");

// Crear una reserva
router.post("/", async (req, res, next) => {
  try {
    const booking = await Booking.create(req.body);
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
