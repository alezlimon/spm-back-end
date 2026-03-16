const router = require("express").Router();
const Room = require("../models/Room.model");

// GET "/api/rooms" 
router.get("/", (req, res, next) => {
  Room.find()
    .then((allRooms) => res.json(allRooms))
    .catch((err) => res.json(err));
});


// POST "/api/rooms" 
router.post("/", (req, res, next) => {
  const { roomNumber, type, pricePerNight } = req.body;
  Room.create({ roomNumber, type, pricePerNight })
    .then((newRoom) => res.json(newRoom))
    .catch((err) => res.json(err));
});

// PUT "/api/rooms/:id" - Editar habitación
router.put("/:id", (req, res, next) => {
  Room.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .then((updatedRoom) => res.json(updatedRoom))
    .catch((err) => res.json(err));
});

// DELETE "/api/rooms/:id" - Eliminar habitación
router.delete("/:id", (req, res, next) => {
  Room.findByIdAndDelete(req.params.id)
    .then(() => res.status(204).send())
    .catch((err) => res.json(err));
});

module.exports = router;