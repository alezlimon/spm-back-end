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

// Obtener todas las reservas 
router.get("/", async (req, res, next) => {
  try {
    const bookings = await Booking.find().populate("room");
    res.json(bookings);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

// Asociar un huésped existente a una reserva existente
router.put('/:bookingId/assign-guest', async (req, res, next) => {
  const { bookingId } = req.params;
  const { guestId } = req.body;
  try {
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { guest: guestId },
      { new: true }
    ).populate('guest');
    if (!updatedBooking) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }
    res.json(updatedBooking);
  } catch (error) {
    next(error);
  }
});
