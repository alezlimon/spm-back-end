require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Room = require("../models/Room.model");
const User = require("../models/User.model");
const Booking = require("../models/Booking.model");
const Guest = require("../models/Guest.model");
const Property = require("../models/Property.model");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/spm";

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    await Booking.deleteMany();
    await Room.deleteMany();
    await User.deleteMany();
    await Guest.deleteMany();
    await Property.deleteMany();

    const properties = await Property.insertMany([
      {
        name: "StayFlow Ocean Retreat",
        type: "Hotel",
        location: "Koh Samui, Thailand",
        image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80",
        description: "Oceanfront resort property with tropical poolside stays and premium guest operations.",
        status: "Active"
      },
      {
        name: "Villa Azure",
        type: "Villa",
        location: "Marbella, Spain",
        image: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80",
        description: "Contemporary private villa designed for full-property stays and high-end guest servicing.",
        status: "Booked"
      },
      {
        name: "Villa Serena",
        type: "Villa",
        location: "Ibiza, Spain",
        image: "https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?auto=format&fit=crop&w=1200&q=80",
        description: "Modern Mediterranean villa with private outdoor living and concierge-style operations.",
        status: "Active"
      },
      {
        name: "StayFlow Lagoon Resort",
        type: "Hotel",
        location: "Bali, Indonesia",
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
        description: "Luxury resort property with expansive poolside hospitality and premium suite operations.",
        status: "Active"
      }
    ]);

    const hotelOne = properties[0];
    const hotelTwo = properties[3];

    console.log("Properties seeded");

    const types = ["Single", "Double", "Suite", "Dorm"];
    const totalRooms = 24;
    const occupiedCount = 8;
    const roomsData = [];

    for (let i = 0; i < totalRooms; i++) {
      const roomNumber = (101 + i).toString();
      const type = types[Math.floor(Math.random() * types.length)];
      const pricePerNight = Math.floor(Math.random() * 400) + 120;

      let status = "Available";
      if (i < occupiedCount) status = "Occupied";
      if (i >= occupiedCount && i < occupiedCount + 3) status = "Dirty";
      if (i === totalRooms - 1) status = "Maintenance";

      const property = i < totalRooms / 2 ? hotelOne._id : hotelTwo._id;

      roomsData.push({
        roomNumber,
        type,
        pricePerNight,
        status,
        property
      });
    }

    const rooms = await Room.insertMany(roomsData);
    console.log(`${totalRooms} hotel rooms seeded`);

    const salt = bcrypt.genSaltSync(10);
    await User.insertMany([
      { email: "admin@hotel.com", password: bcrypt.hashSync("Admin123", salt), name: "Admin" },
      { email: "staff@hotel.com", password: bcrypt.hashSync("Staff123", salt), name: "Staff" },
      { email: "guest@hotel.com", password: bcrypt.hashSync("Guest123", salt), name: "Guest" }
    ]);
    console.log("Users seeded");

    const guestData = [];
    const bookingData = [];

    for (let i = 0; i < occupiedCount; i++) {
      guestData.push({
        firstName: `Guest${i + 1}`,
        lastName: `Test${i + 1}`,
        email: `guest${i + 1}@example.com`,
        phone: `6000000${i + 1}`,
        document: `DOC${1000 + i + 1}`,
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
        checkOut: new Date("2026-03-24"),
        numberOfGuests: 1,
        totalPrice: rooms[i].pricePerNight * 4,
        status: i < 4 ? "Checked-in" : "Confirmed"
      });
    }

    await Booking.insertMany(bookingData);
    console.log(`${occupiedCount} guests and bookings seeded`);

    await mongoose.disconnect();
    console.log("Seeding complete. DB connection closed.");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();