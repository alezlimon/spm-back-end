const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking.model");
const Room = require("../models/Room.model");
const Guest = require("../models/Guest.model");
const { isAuthenticated, requireAdmin } = require("../middleware/jwt.middleware");
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
    canceled: "Cancelled"
  };

  return statusMap[normalized] || status;
}

// Check in a booking
router.put("/:id/checkin", isAuthenticated, requireAdmin, async (req, res, next) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: "Checked-in" },
      { new: true }
    )
      .populate("guest")
      .populate("room");

    if (!booking) {
      return sendError(res, 404, "Booking not found.", "BOOKING_NOT_FOUND");
    }

    await Room.findByIdAndUpdate(booking.room._id, { status: "Occupied" });

    res.json(booking);
  } catch (error) {
    next(error);
  }
});

// Check out a booking
router.put("/:id/checkout", isAuthenticated, requireAdmin, async (req, res, next) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: "Checked-out" },
      { new: true }
    )
      .populate("guest")
      .populate("room");

    if (!booking) {
      return sendError(res, 404, "Booking not found.", "BOOKING_NOT_FOUND");
    }

    await Room.findByIdAndUpdate(booking.room._id, {
      status: "Dirty",
      isClean: false
    });

    res.json(booking);
  } catch (error) {
    next(error);
  }
});

// Create booking
router.post("/", isAuthenticated, requireAdmin, async (req, res, next) => {
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
      status
    } = req.body;

    if (!room) {
      return sendError(
        res,
        400,
        "room is required",
        "BOOKING_ROOM_REQUIRED",
        ["room is required"]
      );
    }

    const roomDoc = await Room.findById(room);

    if (!roomDoc) {
      return sendError(res, 404, "Room not found", "ROOM_NOT_FOUND");
    }

    const checkInDate = parseDateInput(checkIn);
    const checkOutDate = parseDateInput(checkOut);

    if (
      !checkInDate ||
      !checkOutDate ||
      Number.isNaN(checkInDate.getTime()) ||
      Number.isNaN(checkOutDate.getTime())
    ) {
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
        $or: [{ email: normalizedEmail }, { document: normalizedDocument }]
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
          birthDate: parsedBirthDate
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
      status: normalizeBookingStatus(status)
    });

    await Room.findByIdAndUpdate(booking.room, {
      status: "Occupied",
      isClean: false
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate("room")
      .populate("guest");

    res.status(201).json(populatedBooking);
  } catch (err) {
    next(err);
  }
});

// List bookings with filters and pagination
router.get("/", async (req, res, next) => {
  try {
    const {
      propertyId,
      status,
      date,
      from,
      to,
      page = 1,
      limit = 10
    } = req.query;

    const numericPage = Math.max(1, Number.parseInt(page, 10) || 1);
    const numericLimit = Math.max(1, Number.parseInt(limit, 10) || 10);
    const skip = (numericPage - 1) * numericLimit;

    const bookingQuery = {};
    const normalizedStatus = normalizeBookingStatus(status);

    if (normalizedStatus) {
      bookingQuery.status = normalizedStatus;
    }

    if (propertyId) {
      const propertyRooms = await Room.find({ property: propertyId }).select("_id");
      const roomIds = propertyRooms.map((room) => room._id);

      if (roomIds.length === 0) {
        return res.json({
          data: [],
          pagination: {
            total: 0,
            page: numericPage,
            limit: numericLimit,
            totalPages: 1
          }
        });
      }

      bookingQuery.room = { $in: roomIds };
    }

    const dateFilters = [];

    if (date) {
      const selectedDate = parseDateInput(date);

      if (selectedDate && !Number.isNaN(selectedDate.getTime())) {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        dateFilters.push({
          checkIn: { $lte: endOfDay },
          checkOut: { $gte: startOfDay }
        });
      }
    }

    if (from || to) {
      const fromDate = from ? parseDateInput(from) : null;
      const toDate = to ? parseDateInput(to) : null;

      const rangeStart =
        fromDate && !Number.isNaN(fromDate.getTime()) ? new Date(fromDate) : null;
      const rangeEnd =
        toDate && !Number.isNaN(toDate.getTime()) ? new Date(toDate) : null;

      if (rangeStart) {
        rangeStart.setHours(0, 0, 0, 0);
      }

      if (rangeEnd) {
        rangeEnd.setHours(23, 59, 59, 999);
      }

      if (rangeStart || rangeEnd) {
        const overlapFilter = {};

        if (rangeEnd) {
          overlapFilter.checkIn = { $lte: rangeEnd };
        }

        if (rangeStart) {
          overlapFilter.checkOut = { $gte: rangeStart };
        }

        dateFilters.push(overlapFilter);
      }
    }

    if (dateFilters.length === 1) {
      Object.assign(bookingQuery, dateFilters[0]);
    } else if (dateFilters.length > 1) {
      bookingQuery.$and = dateFilters;
    }

    const total = await Booking.countDocuments(bookingQuery);

    const bookings = await Booking.find(bookingQuery)
      .populate("room")
      .populate("guest")
      .sort({ checkIn: 1, createdAt: -1 })
      .skip(skip)
      .limit(numericLimit);

    res.json({
      data: bookings,
      pagination: {
        total,
        page: numericPage,
        limit: numericLimit,
        totalPages: Math.max(1, Math.ceil(total / numericLimit))
      }
    });
  } catch (err) {
    next(err);
  }
});

// Get booking detail
router.get("/:id", isAuthenticated, requireAdmin, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("room", "_id roomNumber type")
      .populate("guest", "_id firstName lastName email");

    if (!booking) {
      return sendError(res, 404, "Booking not found.", "BOOKING_NOT_FOUND");
    }

    res.json(booking);
  } catch (err) {
    next(err);
  }
});

// Assign existing guest to booking
router.put("/:bookingId/assign-guest", isAuthenticated, requireAdmin, async (req, res, next) => {
  const { bookingId } = req.params;
  const { guestId } = req.body;

  try {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return sendError(res, 404, "Booking not found.", "BOOKING_NOT_FOUND");
    }

    const guest = await Guest.findById(guestId);

    if (!guest) {
      return sendError(res, 404, "Guest not found.", "GUEST_NOT_FOUND");
    }

    booking.guest = guestId;
    await booking.save();

    const updatedBooking = await Booking.findById(bookingId)
      .populate("guest")
      .populate("room");

    res.json(updatedBooking);
  } catch (error) {
    next(error);
  }
});

module.exports = router;