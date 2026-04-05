const router = require("express").Router();
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

// POST / - Crear un nuevo huésped
router.post("/", isAuthenticated, async (req, res, next) => {
  try {
    const { birthDate, ...rest } = req.body;
    const parsedBirthDate = parseDateInput(birthDate);
    if (!parsedBirthDate || Number.isNaN(parsedBirthDate.getTime())) {
      return sendError(
        res,
        400,
        "Birth date is required and must be a valid date (YYYY-MM-DD)",
        "GUEST_BIRTHDATE_INVALID",
        ["birthDate is missing or invalid"]
      );
    }

    const normalizedEmail = (rest.email || "").trim().toLowerCase();
    const normalizedDocument = (rest.document || "").trim().toUpperCase();

    const existingGuest = await Guest.findOne({
      $or: [{ email: normalizedEmail }, { document: normalizedDocument }],
    });

    if (existingGuest) {
      return sendError(
        res,
        409,
        "Guest already exists with the same email or document.",
        "GUEST_DUPLICATE",
        ["email or document already exists"]
      );
    }

    const guest = await Guest.create({
      ...rest,
      email: normalizedEmail,
      document: normalizedDocument,
      birthDate: parsedBirthDate,
    });

    res.status(201).json(guest);
  } catch (error) {
    next(error);
  }
});

// GET / - Listar todos los huéspedes
router.get("/", async (req, res, next) => {
  try {
    const guests = await Guest.find();
    res.json(guests);
  } catch (error) {
    next(error);
  }
});

// GET /search?query= - Buscar huéspedes por nombre o pasaporte/DNI
router.get("/search", async (req, res, next) => {
  const { query } = req.query;
  try {
    if (!query || !String(query).trim()) {
      return sendError(
        res,
        400,
        "Search query is required.",
        "GUEST_SEARCH_QUERY_REQUIRED",
        ["query parameter is required"]
      );
    }

    const guests = await Guest.find({
      $or: [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        { document: { $regex: query, $options: "i" } }
      ]
    });
    res.json(guests);
  } catch (error) {
    next(error);
  }
});

// PUT /:id - Editar datos de un huésped
router.put("/:id", isAuthenticated, async (req, res, next) => {
  try {
    const { birthDate, ...rest } = req.body;
    const parsedBirthDate = parseDateInput(birthDate);
    if (!parsedBirthDate || Number.isNaN(parsedBirthDate.getTime())) {
      return sendError(
        res,
        400,
        "Birth date is required and must be a valid date (YYYY-MM-DD)",
        "GUEST_BIRTHDATE_INVALID",
        ["birthDate is missing or invalid"]
      );
    }
    const updatedGuest = await Guest.findByIdAndUpdate(
      req.params.id,
      { ...rest, birthDate: parsedBirthDate },
      { new: true }
    );
    if (!updatedGuest) {
      return sendError(res, 404, "Guest not found.", "GUEST_NOT_FOUND");
    }
    res.json(updatedGuest);
  } catch (error) {
    next(error);
  }
});

// DELETE /:id - Eliminar un huésped
router.delete("/:id", isAuthenticated, async (req, res, next) => {
  try {
    const deletedGuest = await Guest.findByIdAndDelete(req.params.id);
    if (!deletedGuest) {
      return sendError(res, 404, "Guest not found.", "GUEST_NOT_FOUND");
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
