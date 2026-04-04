
const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking.model");
const Room = require("../models/Room.model");
const Guest = require("../models/Guest.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");

// Check-in de una reserva
router.put('/:id/checkin', isAuthenticated, async (req, res, next) => {
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
router.put('/:id/checkout', isAuthenticated, async (req, res, next) => {
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
router.post("/", isAuthenticated, async (req, res, next) => {
  try {
    const {
      room,
      guest,
      guestId,
      guestData,
      primaryGuest,
      checkIn,
      checkOut,
      numberOfGuests,
      totalPrice,
      status,
    } = req.body;

    if (!room) {
      return res.status(400).json({ message: "room is required" });
    }

    const roomDoc = await Room.findById(room);
    if (!roomDoc) {
      return res.status(404).json({ message: "Room not found" });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
      return res.status(400).json({ message: "checkIn and checkOut must be valid dates" });
    }
    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ message: "checkOut must be after checkIn" });
    }

    let resolvedGuest = guest || guestId;
    const inlineGuest = guestData || primaryGuest;

    // If frontend sends a full guest payload from the reservation modal,
    // create the guest first and then link it to the booking.
    if (!resolvedGuest && inlineGuest) {
      const requiredGuestFields = ["firstName", "lastName", "email", "document", "birthDate"];
      const missing = requiredGuestFields.filter((field) => !inlineGuest[field]);
      if (missing.length) {
        return res.status(400).json({
          message: "Missing required guest fields",
          missing,
        });
      }

      const normalizedEmail = String(inlineGuest.email).trim().toLowerCase();
      const normalizedDocument = String(inlineGuest.document).trim().toUpperCase();

      const existingGuest = await Guest.findOne({
        $or: [{ email: normalizedEmail }, { document: normalizedDocument }],
      });

      if (existingGuest) {
        resolvedGuest = existingGuest._id;
      } else {
        const createdGuest = await Guest.create({
          ...inlineGuest,
          email: normalizedEmail,
          document: normalizedDocument,
        });
        resolvedGuest = createdGuest._id;
      }
    }

    if (!resolvedGuest) {
      return res.status(400).json({
        message: "guest (or guestId) is required, or provide guestData/primaryGuest",
      });
    }

    const nights = Math.max(1, Math.ceil((checkOutDate - checkInDate) / 86400000));
    const computedTotalPrice =
      typeof totalPrice === "number" ? totalPrice : roomDoc.pricePerNight * nights;

    const booking = await Booking.create({
      room,
      guest: resolvedGuest,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      numberOfGuests: numberOfGuests ?? 1,
      totalPrice: computedTotalPrice,
      status,
    });

    // Cambiar el estado de la habitación a 'Occupied' automáticamente
    await Room.findByIdAndUpdate(booking.room, { status: "Occupied" });

    const populatedBooking = await Booking.findById(booking._id)
      .populate("room")
      .populate("guest");

    res.status(201).json(populatedBooking);
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

// Asociar un huésped existente a una reserva existente
router.put('/:bookingId/assign-guest', isAuthenticated, async (req, res, next) => {
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

module.exports = router;
