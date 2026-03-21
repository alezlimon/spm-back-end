
const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking.model");
const Room = require("../models/Room.model");

// Check-in de una reserva
router.put('/:id/checkin', async (req, res, next) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'Checked-in' },
      { new: true }
    ).populate('guest').populate('room');
    if (!booking) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

// Check-out de una reserva
router.put('/:id/checkout', async (req, res, next) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'Checked-out' },
      { new: true }
    ).populate('guest').populate('room');
    if (!booking) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

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
// Obtener todas las reservas, incluyendo huésped y habitación
router.get("/", async (req, res, next) => {
  try {
    const bookings = await Booking.find().populate("room").populate("guest");
    res.json(bookings);
  } catch (err) {
    next(err);
  }
});

// Obtener detalle de una reserva por ID, incluyendo huésped y habitación
router.get("/:id", async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("room").populate("guest");
    if (!booking) {
      return res.status(404).json({ message: "Reserva no encontrada" });
    }
    res.json(booking);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

// Asociar un huésped existente a una reserva existente
const Guest = require("../models/Guest.model");
router.put('/:bookingId/assign-guest', async (req, res, next) => {
  const { bookingId } = req.params;
  const { guestId } = req.body;
  try {
    // Validar existencia de reserva
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }
    // Validar existencia de huésped
    const guest = await Guest.findById(guestId);
    if (!guest) {
      return res.status(404).json({ message: 'Huésped no encontrado' });
    }
    booking.guest = guestId;
    await booking.save();
    const updatedBooking = await Booking.findById(bookingId).populate('guest').populate('room');
    res.json(updatedBooking);
  } catch (error) {
    next(error);
  }
});
