const router = require("express").Router();
const Guest = require("../models/Guest.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");

// POST / - Crear un nuevo huésped
router.post("/", isAuthenticated, async (req, res, next) => {
  try {
    const { birthDate, ...rest } = req.body;
    if (!birthDate || isNaN(Date.parse(birthDate))) {
      return res.status(400).json({ message: "El campo birthDate es obligatorio y debe ser una fecha válida (YYYY-MM-DD)" });
    }
    const guest = await Guest.create({ ...rest, birthDate });
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
    if (!birthDate || isNaN(Date.parse(birthDate))) {
      return res.status(400).json({ message: "El campo birthDate es obligatorio y debe ser una fecha válida (YYYY-MM-DD)" });
    }
    const updatedGuest = await Guest.findByIdAndUpdate(
      req.params.id,
      { ...rest, birthDate },
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
