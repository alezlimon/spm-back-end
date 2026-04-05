
const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking.model");
const Room = require("../models/Room.model");
const Guest = require("../models/Guest.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const { sendError } = require("../utils/error-response");

function parseDateInput(value) {
  if (!value) return null;

  if (value instanceof Date) return value;

  const raw = String(value).trim();
  const ddmmyyyyMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return new Date(`${year}-${month}-${day}`);
  }

  return new Date(raw);
}

function normalizeBookingStatus(status) {
  if (!status) return undefined;

  const normalized = String(status).trim().toLowerCase();
  const statusMap = {
    confirmed: "Confirmed",
    "checked-in": "Checked-in",
    checkedin: "Checked-in",
    "checked-out": "Checked-out",
    checkedout: "Checked-out",
    cancelled: "Cancelled",
    canceled: "Cancelled",
  };

  return statusMap[normalized] || status;
}

// Check-in de una reserva
router.put('/:id/checkin', isAuthenticated, async (req, res, next) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'Checked-in' },
      { new: true }
    ).populate('guest').populate('room');
    if (!booking) {
      return sendError(res, 404, 'Booking not found.', 'BOOKING_NOT_FOUND');
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
      return sendError(res, 404, 'Booking not found.', 'BOOKING_NOT_FOUND');
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
      return sendError(res, 400, "room is required", "BOOKING_ROOM_REQUIRED", ["room is required"]);
    }

    const roomDoc = await Room.findById(room);
    if (!roomDoc) {
      return sendError(res, 404, "Room not found", "ROOM_NOT_FOUND");
    }

    const checkInDate = parseDateInput(checkIn);
    const checkOutDate = parseDateInput(checkOut);
    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
      return sendError(
        res,
        400,
        "checkIn and checkOut must be valid dates",
        "BOOKING_DATES_INVALID",
        ["checkIn must be a valid date", "checkOut must be a valid date"]
      );
    }
    if (checkOutDate <= checkInDate) {
      return sendError(
        res,
        400,
        "checkOut must be after checkIn",
        "BOOKING_DATE_RANGE_INVALID",
        ["checkOut must be greater than checkIn"]
      );
    }

    let resolvedGuest = guest || guestId;
    const inlineGuest = guestData || primaryGuest;

    // If frontend sends a full guest payload from the reservation modal,
    // create the guest first and then link it to the booking.
    if (!resolvedGuest && inlineGuest) {
      const requiredGuestFields = ["firstName", "lastName", "email", "document", "birthDate"];
      const missing = requiredGuestFields.filter((field) => !inlineGuest[field]);
      if (missing.length) {
        return sendError(
          res,
          400,
          "Missing required guest fields",
          "BOOKING_GUEST_FIELDS_MISSING",
          missing.map((field) => `${field} is required`)
        );
      }

      const normalizedEmail = String(inlineGuest.email).trim().toLowerCase();
      const normalizedDocument = String(inlineGuest.document).trim().toUpperCase();

      const existingGuest = await Guest.findOne({
        $or: [{ email: normalizedEmail }, { document: normalizedDocument }],
      });

      if (existingGuest) {
        resolvedGuest = existingGuest._id;
      } else {
        const parsedBirthDate = parseDateInput(inlineGuest.birthDate);
        if (!parsedBirthDate || Number.isNaN(parsedBirthDate.getTime())) {
          return sendError(
            res,
            400,
            "primaryGuest.birthDate must be a valid date",
            "BOOKING_GUEST_BIRTHDATE_INVALID",
            ["primaryGuest.birthDate is missing or invalid"]
          );
        }

        const createdGuest = await Guest.create({
          ...inlineGuest,
          email: normalizedEmail,
          document: normalizedDocument,
          birthDate: parsedBirthDate,
        });
        resolvedGuest = createdGuest._id;
      }
    }

    if (!resolvedGuest) {
      return sendError(
        res,
        400,
        "guest (or guestId) is required, or provide guestData/primaryGuest",
        "BOOKING_GUEST_REQUIRED",
        ["guest, guestId, guestData or primaryGuest is required"]
      );
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
      status: normalizeBookingStatus(status),
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
      return sendError(res, 404, "Booking not found.", "BOOKING_NOT_FOUND");
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
      return sendError(res, 404, 'Booking not found.', 'BOOKING_NOT_FOUND');
    }
    // Validar existencia de huésped
    const guest = await Guest.findById(guestId);
    if (!guest) {
      return sendError(res, 404, 'Guest not found.', 'GUEST_NOT_FOUND');
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
