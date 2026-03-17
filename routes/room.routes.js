const router = require("express").Router();
const Room = require("../models/Room.model");


// GET "/api/rooms" - Get all rooms
router.get("/", async (req, res, next) => {
  try {
    const allRooms = await Room.find();
    res.status(200).json(allRooms);
  } catch (err) {
    next(err);
  }
});


// GET "/api/rooms/:id" - Get one room
router.get("/:id", async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.status(200).json(room);
  } catch (err) {
    next(err);
  }
});


// POST "/api/rooms" - Create room
router.post("/", async (req, res, next) => {
  try {
    const { roomNumber, type, pricePerNight } = req.body;

    const newRoom = await Room.create({
      roomNumber,
      type,
      pricePerNight
    });

    res.status(201).json(newRoom);
  } catch (err) {
    next(err);
  }
});


// PUT "/api/rooms/:id" - Update room
router.put("/:id", async (req, res, next) => {
  try {
    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json(updatedRoom);
  } catch (err) {
    next(err);
  }
});


// DELETE "/api/rooms/:id" - Delete room
router.delete("/:id", async (req, res, next) => {
  try {
    await Room.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});


module.exports = router;