const express = require("express");
const router = express.Router();

router.get("/", (req, res, next) => {
  res.json("All good in here");
});

router.use("/rooms", require("./room.routes"));
router.use("/auth", require("./auth.routes"));
router.use("/bookings", require("./booking.routes"));

module.exports = router;
