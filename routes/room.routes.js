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

module.exports = router;