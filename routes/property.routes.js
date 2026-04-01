const router = require("express").Router();
const Property = require("../models/Property.model");
const Room = require("../models/Room.model");

// GET all properties
router.get("/", async (req, res, next) => {
  try {
    const properties = await Property.find().sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    next(error);
  }
});

// GET one property
router.get("/:propertyId", async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const rooms = await Room.find({ property: propertyId }).sort({ roomNumber: 1 });

    res.json({ property, rooms });
  } catch (error) {
    next(error);
  }
});

// POST new property
router.post("/", async (req, res, next) => {
  try {
    const createdProperty = await Property.create(req.body);
    res.status(201).json(createdProperty);
  } catch (error) {
    next(error);
  }
});

module.exports = router;