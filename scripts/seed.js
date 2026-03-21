// scripts/seed.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Room = require("../models/Room.model");
const User = require("../models/User.model");
const Booking = require("../models/Booking.model");
const Guest = require("../models/Guest.model");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/spm";

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Clean previous data
    await Booking.deleteMany();
    await Room.deleteMany();
    await User.deleteMany();
    await Guest.deleteMany();


    // Seed 333 Rooms, pero solo una parte estarán ocupadas y tendrán booking y huésped
    const types = ["Single", "Double", "Suite", "Dorm"];
    const totalRooms = 333;
    const occupiedCount = 100; // Por ejemplo, 100 habitaciones ocupadas
    const availableCount = totalRooms - occupiedCount;
    const roomsData = [];
    for (let i = 0; i < totalRooms; i++) {
      const roomNumber = (100 + i + 1).toString();
      const type = types[Math.floor(Math.random() * types.length)];
      const pricePerNight = Math.floor(Math.random() * 9000) + 1000;
      let status = "Available";
      if (i < occupiedCount) status = "Occupied";
      roomsData.push({ roomNumber, type, pricePerNight, status });
    }
    const rooms = await Room.insertMany(roomsData);
    console.log(`${totalRooms} rooms seeded (${occupiedCount} occupied)`);

    // Seed Users
    const salt = bcrypt.genSaltSync(10);
    const users = await User.insertMany([
      { email: "admin@hotel.com", password: bcrypt.hashSync("Admin123", salt), name: "Admin" },
      { email: "staff@hotel.com", password: bcrypt.hashSync("Staff123", salt), name: "Staff" },
      { email: "guest@hotel.com", password: bcrypt.hashSync("Guest123", salt), name: "Guest" }
    ]);
    console.log("Users seeded");



    // Seed Guests y Bookings para habitaciones ocupadas
    const guestData = [];
    const bookingData = [];
    for (let i = 0; i < occupiedCount; i++) {
      guestData.push({
        firstName: `Guest${i+1}`,
        lastName: `Test${i+1}`,
        email: `guest${i+1}@example.com`,
        phone: `6000000${i+1}`,
        document: `DOC${1000+i+1}`,
        nationality: "Testland",
        notes: i % 2 === 0 ? "VIP" : "",
        birthDate: new Date(1990, 0, 1 + (i % 28))
      });
    }
    const guests = await Guest.insertMany(guestData);
    for (let i = 0; i < occupiedCount; i++) {
      bookingData.push({
        room: rooms[i]._id,
        guest: guests[i]._id,
        checkIn: new Date("2026-03-20"),
        checkOut: new Date("2026-03-22"),
        numberOfGuests: 1,
        totalPrice: 100 + i,
        status: "Confirmed"
      });
    }
    await Booking.insertMany(bookingData);
    console.log(`${occupiedCount} guests and bookings seeded (1:1 with occupied rooms)`);

    await mongoose.disconnect();
    console.log("Seeding complete. DB connection closed.");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
