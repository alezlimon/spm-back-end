// scripts/seed.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Property = require("../models/Property.model");
const Room = require("../models/Room.model");
const User = require("../models/User.model");
const Booking = require("../models/Booking.model");
const Guest = require("../models/Guest.model");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/spm";

// Price per room type
const PRICES = {
  Single: 80,
  Double: 120,
  Suite: 250,
  Deluxe: 180,
  Familiar: 150,
  Twins: 100,
  Dorm: 35,
};

// 7 properties with exact room inventory from the epic
const PROPERTY_CONFIGS = [
  {
    name: "Alpine House",
    description: "Mountain retreat with panoramic Alpine views.",
    location: "Chamonix, France",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    inventory: [
      { type: "Suite", count: 2 },
      { type: "Deluxe", count: 6 },
      { type: "Familiar", count: 2 },
      { type: "Twins", count: 4 },
    ],
  },
  {
    name: "Dune House",
    description: "Desert boutique hotel surrounded by golden dunes.",
    location: "Sahara, Morocco",
    image: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800",
    inventory: [
      { type: "Suite", count: 2 },
      { type: "Double", count: 20 },
    ],
  },
  {
    name: "Riad Noir",
    description: "Traditional Moroccan riad with courtyard garden.",
    location: "Marrakech, Morocco",
    image: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800",
    inventory: [
      { type: "Single", count: 6 },
      { type: "Double", count: 6 },
      { type: "Familiar", count: 4 },
    ],
  },
  {
    name: "Harbor Club",
    description: "Waterfront hotel with private marina access.",
    location: "Barcelona, Spain",
    image: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800",
    inventory: [
      { type: "Double", count: 20 },
      { type: "Twins", count: 20 },
      { type: "Single", count: 10 },
    ],
  },
  {
    name: "Villa Azure",
    description: "Cliffside villa with infinity pool overlooking the sea.",
    location: "Santorini, Greece",
    image: "https://images.unsplash.com/photo-1570737209810-87a8e7245f88?w=800",
    inventory: [
      { type: "Suite", count: 4 },
      { type: "Double", count: 4 },
      { type: "Twins", count: 4 },
    ],
  },
  {
    name: "Villa Mirador",
    description: "Hilltop estate with panoramic countryside views.",
    location: "Tuscany, Italy",
    image: "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800",
    inventory: [
      { type: "Suite", count: 4 },
      { type: "Double", count: 8 },
      { type: "Familiar", count: 4 },
      { type: "Single", count: 2 },
    ],
  },
  {
    name: "Villa Solene",
    description: "Provençal estate surrounded by vineyards and lavender.",
    location: "Provence, France",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
    inventory: [
      { type: "Suite", count: 3 },
      { type: "Twins", count: 5 },
      { type: "Double", count: 10 },
      { type: "Single", count: 4 },
    ],
  },
];

// Generate room documents for a property (sequential numbering from 101)
function buildRoomDocs(propertyId, inventory) {
  const docs = [];
  let num = 101;
  for (const { type, count } of inventory) {
    for (let i = 0; i < count; i++) {
      docs.push({
        property: propertyId,
        roomNumber: String(num++),
        type,
        pricePerNight: PRICES[type],
        status: "Available",
      });
    }
  }
  return docs;
}

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // --- Clean previous data ---
    await Booking.deleteMany();
    await Guest.deleteMany();
    await User.deleteMany();
    await Property.deleteMany();
    // Drop rooms collection to reset indexes (old unique-on-roomNumber → new compound index)
    await Room.collection.drop().catch(() => {});
    await Room.syncIndexes();

    // --- Users ---
    const salt = bcrypt.genSaltSync(10);
    await User.insertMany([
      { email: "admin@hotel.com", password: bcrypt.hashSync("Admin123!", salt), name: "Admin" },
      { email: "staff@hotel.com", password: bcrypt.hashSync("Staff123!", salt), name: "Staff" },
    ]);
    console.log("Users seeded");

    // --- Date helpers (relative to today so overview KPIs are always live) ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const in3Days = new Date(today);
    in3Days.setDate(today.getDate() + 3);

    let guestCounter = 1;
    let totalRoomsSeeded = 0;
    let totalBookingsSeeded = 0;

    // --- Properties, rooms and bookings ---
    for (const config of PROPERTY_CONFIGS) {
      const { name, description, location, image, inventory } = config;

      const property = await Property.create({ name, description, location, image });
      const roomDocs = buildRoomDocs(property._id, inventory);
      const totalRooms = roomDocs.length;

      // Proportional booking categories
      const ongoingCount      = Math.max(1, Math.floor(totalRooms * 0.35)); // active stays
      const departingCount    = Math.max(1, Math.floor(totalRooms * 0.07)); // depart today
      const checkedOutCount   = Math.max(1, Math.floor(totalRooms * 0.07)); // checked-out today
      const arrivingCount     = Math.max(1, Math.floor(totalRooms * 0.07)); // arrive today

      // Assign room statuses before insert
      for (let i = 0; i < roomDocs.length; i++) {
        if (i < ongoingCount + departingCount) {
          roomDocs[i].status = "Occupied";
        } else if (i < ongoingCount + departingCount + checkedOutCount) {
          roomDocs[i].status = "Dirty";
        }
        // rest remain "Available"
      }

      const rooms = await Room.insertMany(roomDocs);
      totalRoomsSeeded += rooms.length;

      // Build guests and bookings
      const guestDocs = [];
      const bookingMeta = []; // { roomIdx, checkIn, checkOut, status, nights }

      // Ongoing Checked-in (depart in 3 days)
      for (let i = 0; i < ongoingCount; i++) {
        bookingMeta.push({ roomIdx: i, checkIn: yesterday, checkOut: in3Days, status: "Checked-in" });
      }
      // Departing today (still Checked-in, checkout = today)
      for (let i = ongoingCount; i < ongoingCount + departingCount; i++) {
        bookingMeta.push({ roomIdx: i, checkIn: twoDaysAgo, checkOut: today, status: "Checked-in" });
      }
      // Checked-out today (room = Dirty)
      for (let i = ongoingCount + departingCount; i < ongoingCount + departingCount + checkedOutCount; i++) {
        bookingMeta.push({ roomIdx: i, checkIn: twoDaysAgo, checkOut: today, status: "Checked-out" });
      }
      // Arriving today (room = Available, booking = Confirmed)
      const arriveStart = ongoingCount + departingCount + checkedOutCount;
      for (let i = arriveStart; i < Math.min(arriveStart + arrivingCount, rooms.length); i++) {
        bookingMeta.push({ roomIdx: i, checkIn: today, checkOut: in3Days, status: "Confirmed" });
      }

      // Create one guest per booking
      for (let i = 0; i < bookingMeta.length; i++) {
        guestDocs.push({
          firstName: `Guest${guestCounter}`,
          lastName: `Test`,
          email: `guest${guestCounter}@example.com`,
          phone: `600${String(guestCounter).padStart(6, "0")}`,
          document: `DOC${String(guestCounter).padStart(6, "0")}`,
          nationality: "Testland",
          birthDate: new Date(1988, (guestCounter % 12), (guestCounter % 28) + 1),
        });
        guestCounter++;
      }

      const guests = await Guest.insertMany(guestDocs);

      const bookingDocs = bookingMeta.map((meta, idx) => ({
        room: rooms[meta.roomIdx]._id,
        guest: guests[idx]._id,
        checkIn: meta.checkIn,
        checkOut: meta.checkOut,
        numberOfGuests: 1,
        totalPrice:
          rooms[meta.roomIdx].pricePerNight *
          Math.max(1, Math.round((meta.checkOut - meta.checkIn) / 86400000)),
        status: meta.status,
      }));

      await Booking.insertMany(bookingDocs);
      totalBookingsSeeded += bookingDocs.length;

      console.log(
        `${name}: ${rooms.length} rooms | ${ongoingCount} ongoing, ${departingCount} departing today, ${checkedOutCount} checked-out today, ${arrivingCount} arriving today`
      );
    }

    console.log(`\nTotal rooms seeded:    ${totalRoomsSeeded}`);
    console.log(`Total bookings seeded: ${totalBookingsSeeded}`);
    console.log(`Total guests seeded:   ${guestCounter - 1}`);

    await mongoose.disconnect();
    console.log("Seeding complete. DB connection closed.");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
