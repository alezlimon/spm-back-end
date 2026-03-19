
const router = require("express").Router();
const Room = require("../models/Room.model");

// GET - Listar todas las habitaciones
router.get("/", (req, res, next) => {
  Room.find()
    .then((allRooms) => res.json(allRooms))
    .catch((err) => next(err));
});

// POST - Crear nueva habitación
router.post("/", (req, res, next) => {
  const { roomNumber, type, pricePerNight } = req.body;
  Room.create({ roomNumber, type, pricePerNight })
    .then((newRoom) => res.status(201).json(newRoom))
    .catch((err) => next(err));
});

// PATCH - Lógica circular de estados (La clave del CRM)
router.patch("/:roomId/status", async (req, res, next) => {
  const { roomId } = req.params;
  try {
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    let nextStatus = room.status;
    if (room.status === "Available") nextStatus = "Occupied";
    else if (room.status === "Occupied") nextStatus = "Dirty";
    else if (room.status === "Dirty") nextStatus = "Available";

    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      { status: nextStatus },
      { new: true }
    );
    res.json(updatedRoom);
  } catch (error) {
    next(error);
  }
});

// PUT - Editar datos generales
router.put("/:id", (req, res, next) => {
  Room.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .then((updatedRoom) => res.json(updatedRoom))
    .catch((err) => next(err));
});

// DELETE - Eliminar
router.delete("/:id", (req, res, next) => {
  Room.findByIdAndDelete(req.params.id)
    .then(() => res.status(204).send())
    .catch((err) => next(err));
});

module.exports = router;