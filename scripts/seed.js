// scripts/seed.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Room = require("../models/Room.model");
const User = require("../models/User.model");
const Booking = require("../models/Booking.model");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/spm";

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Clean previous data
    await Booking.deleteMany();
    await Room.deleteMany();
    await User.deleteMany();


    // Seed 333 Rooms with random expensive data
    const types = ["Single", "Double", "Suite", "Dorm"];
    const statuses = ["Available", "Occupied", "Maintenance"];
    const roomsData = Array.from({ length: 333 }, (_, i) => {
      const roomNumber = (100 + i + 1).toString();
      const type = types[Math.floor(Math.random() * types.length)];
      const pricePerNight = Math.floor(Math.random() * 9000) + 1000; // Entre 1000 y 9999
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      return { roomNumber, type, pricePerNight, status };
    });
    const rooms = await Room.insertMany(roomsData);
    console.log("333 random expensive rooms seeded");

    // Seed Users
    const salt = bcrypt.genSaltSync(10);
    const users = await User.insertMany([
      { email: "admin@hotel.com", password: bcrypt.hashSync("Admin123", salt), name: "Admin" },
      { email: "staff@hotel.com", password: bcrypt.hashSync("Staff123", salt), name: "Staff" },
      { email: "guest@hotel.com", password: bcrypt.hashSync("Guest123", salt), name: "Guest" }
    ]);
    console.log("Users seeded");

    // Seed Bookings (optional)
    await Booking.create({
      room: rooms[0]._id,
      guestName: "John Doe",
      checkIn: new Date("2026-03-20"),
      checkOut: new Date("2026-03-22"),
      numberOfGuests: 1,
      totalPrice: 160,
      status: "Confirmed"
    });
    console.log("Bookings seeded");

    await mongoose.disconnect();
    console.log("Seeding complete. DB connection closed.");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
