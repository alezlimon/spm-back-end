const router = require("express").Router();
const Guest = require("../models/Guest.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");

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
      return res.status(400).json({ message: "El campo birthDate es obligatorio y debe ser una fecha válida (YYYY-MM-DD)" });
    }

    const normalizedEmail = (rest.email || "").trim().toLowerCase();
    const normalizedDocument = (rest.document || "").trim().toUpperCase();

    const existingGuest = await Guest.findOne({
      $or: [{ email: normalizedEmail }, { document: normalizedDocument }],
    });

    if (existingGuest) {
      return res.status(200).json({
        reused: true,
        message: "Guest already existed. Reusing existing record.",
        guest: existingGuest,
      });
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
      return res.status(400).json({ message: "El campo birthDate es obligatorio y debe ser una fecha válida (YYYY-MM-DD)" });
    }
    const updatedGuest = await Guest.findByIdAndUpdate(
      req.params.id,
      { ...rest, birthDate: parsedBirthDate },
      { new: true }
    );
    res.json(updatedGuest);
  } catch (error) {
    next(error);
  }
});

// DELETE /:id - Eliminar un huésped
router.delete("/:id", isAuthenticated, async (req, res, next) => {
  try {
    await Guest.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
