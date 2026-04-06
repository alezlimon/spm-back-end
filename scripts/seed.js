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
        name: "Dune House",
        type: "Hotel",
        location: "AlUla, Saudi Arabia",
        image:
          "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1600&q=80",
        description:
          "Boutique desert hotel designed around remote luxury, quiet arrival rituals, private suites, and high-touch hospitality operations.",
        status: "Active"
      },
      {
        name: "Alpine House",
        type: "Hotel",
        location: "St. Moritz, Switzerland",
        image:
          "https://images.unsplash.com/photo-1518732714860-b62714ce0c59?auto=format&fit=crop&w=1600&q=80",
        description:
          "Luxury alpine hotel with winter-season readiness, polished guest flow, and discreet service in a high-altitude market.",
        status: "Maintenance"
      },
      {
        name: "Harbor Club",
        type: "Hotel",
        location: "Porto Cervo, Italy",
        image:
          "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=80",
        description:
          "Mediterranean coastal hotel designed for polished arrivals, terrace dining, marina-adjacent stays, and summer guest operations.",
        status: "Active"
      },
      {
        name: "Lagoon Resort",
        type: "Hotel",
        location: "Bali, Indonesia",
        image:
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80",
        description:
          "Resort property centered around poolside hospitality, open-air circulation, and premium suite operations.",
        status: "Active"
      },
      {
        name: "Riad Noir",
        type: "Hotel",
        location: "Marrakech, Morocco",
        image:
          "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1600&q=80",
        description:
          "Intimate riad-style hotel with courtyard-centered circulation, evening hospitality rhythm, and high-touch guest operations.",
        status: "Active"
      },
      {
        name: "Villa Azure",
        type: "Villa",
        location: "Marbella, Spain",
        image:
          "https://images.unsplash.com/photo-1605146769289-440113cc3d00?auto=format&fit=crop&w=1600&q=80",
        description:
          "Contemporary private villa designed for full-property stays, smooth turnover, and high-end guest servicing.",
        status: "Booked"
      },
      {
        name: "Villa Serena",
        type: "Villa",
        location: "Ibiza, Spain",
        image:
          "https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?auto=format&fit=crop&w=1600&q=80",
        description:
          "Mediterranean villa with private outdoor living, guest-ready suite setup, and concierge-style operations.",
        status: "Active"
      },
      {
        name: "Villa Solene",
        type: "Villa",
        location: "Cap Ferrat, France",
        image:
          "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1600&q=80",
        description:
          "Seafront villa with layered terraces, discreet hosting flow, and full-estate readiness standards.",
        status: "Active"
      },
      {
        name: "Villa Mirador",
        type: "Villa",
        location: "Mallorca, Spain",
        image:
          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80",
        description:
          "Hillside villa with panoramic outdoor living, elevated guest privacy, and prep-heavy turnover operations.",
        status: "Maintenance"
      }
    ]);

    const propertyMap = {
      duneHouse: properties[0],
      alpineHouse: properties[1],
      harborClub: properties[2],
      lagoonResort: properties[3],
      riadNoir: properties[4],
      villaAzure: properties[5],
      villaSerena: properties[6],
      villaSolene: properties[7],
      villaMirador: properties[8]
    };

    console.log("Properties seeded");

    const roomBlueprints = [
      {
        property: propertyMap.duneHouse,
        prefix: "DUNE",
        startNumber: 101,
        rooms: 10,
        statuses: ["Occupied", "Occupied", "Available", "Available", "Dirty", "Available", "Available", "Occupied", "Maintenance", "Available"]
      },
      {
        property: propertyMap.alpineHouse,
        prefix: "ALPINE",
        startNumber: 201,
        rooms: 10,
        statuses: ["Maintenance", "Maintenance", "Dirty", "Available", "Available", "Occupied", "Available", "Available", "Occupied", "Available"]
      },
      {
        property: propertyMap.harborClub,
        prefix: "HARBOR",
        startNumber: 301,
        rooms: 10,
        statuses: ["Occupied", "Available", "Available", "Occupied", "Dirty", "Available", "Available", "Available", "Available", "Maintenance"]
      },
      {
        property: propertyMap.lagoonResort,
        prefix: "LAGOON",
        startNumber: 401,
        rooms: 12,
        statuses: ["Occupied", "Occupied", "Available", "Available", "Available", "Dirty", "Available", "Available", "Available", "Available", "Maintenance", "Available"]
      },
      {
        property: propertyMap.riadNoir,
        prefix: "RIAD",
        startNumber: 501,
        rooms: 8,
        statuses: ["Occupied", "Available", "Available", "Dirty", "Available", "Occupied", "Available", "Maintenance"]
      },
      {
        property: propertyMap.villaAzure,
        prefix: "AZURE",
        startNumber: 1,
        rooms: 4,
        statuses: ["Occupied", "Occupied", "Available", "Dirty"]
      },
      {
        property: propertyMap.villaSerena,
        prefix: "SERENA",
        startNumber: 1,
        rooms: 4,
        statuses: ["Available", "Available", "Available", "Available"]
      },
      {
        property: propertyMap.villaSolene,
        prefix: "SOLENE",
        startNumber: 1,
        rooms: 5,
        statuses: ["Available", "Occupied", "Available", "Dirty", "Available"]
      },
      {
        property: propertyMap.villaMirador,
        prefix: "MIRADOR",
        startNumber: 1,
        rooms: 5,
        statuses: ["Maintenance", "Available", "Dirty", "Available", "Available"]
      }
    ];

    const hotelTypes = ["Single", "Double", "Suite"];
    const villaTypes = ["Suite", "Suite", "Double", "Double", "Single"];

    const roomsData = [];

    roomBlueprints.forEach((blueprint) => {
      for (let i = 0; i < blueprint.rooms; i++) {
        const isHotel = blueprint.property.type === "Hotel";
        const roomNumber = `${blueprint.prefix}-${blueprint.startNumber + i}`;
        const status = blueprint.statuses[i];
        const type = isHotel
          ? hotelTypes[i % hotelTypes.length]
          : villaTypes[i % villaTypes.length];

        const pricePerNight = isHotel ? 260 + i * 40 : 950 + i * 180;

        roomsData.push({
          roomNumber,
          type,
          pricePerNight,
          status,
          description: isHotel
            ? `${type} with premium hospitality setup and operational turnover standards.`
            : `${type} configured within the estate for high-touch private stay operations.`,
          property: blueprint.property._id
        });
      }
    });

    const rooms = await Room.insertMany(roomsData);
    console.log(`${rooms.length} rooms seeded`);

    const salt = bcrypt.genSaltSync(10);
    const tempAdminPassword = "RevaAdmin2026!";
    await User.insertMany([
      {
        email: "alejandro.perez@reva.com",
        password: bcrypt.hashSync(tempAdminPassword, salt),
        name: "Alejandro Perez",
        role: "admin",
      },
      {
        email: "luana.aguilo@reva.com",
        password: bcrypt.hashSync(tempAdminPassword, salt),
        name: "Luana Aguilo",
        role: "admin",
      },
      {
        email: "ops@reva.com",
        password: bcrypt.hashSync("Ops12345", salt),
        name: "Operations",
        role: "staff",
      },
      {
        email: "staff@reva.com",
        password: bcrypt.hashSync("Staff123", salt),
        name: "Staff",
        role: "staff",
      }
    ]);
    console.log("Users seeded");

    const guestSeed = [
      ["Lucas", "Meyer"],
      ["Sofia", "Rossi"],
      ["Nina", "Hartmann"],
      ["James", "Cole"],
      ["Lina", "Dupont"],
      ["Marcus", "Vale"],
      ["Emma", "Fischer"],
      ["Leo", "Moreau"],
      ["Chiara", "Bennett"],
      ["Daniel", "Keller"],
      ["Mila", "Santos"],
      ["Oliver", "Reed"]
    ];

    const guests = await Guest.insertMany(
      guestSeed.map((guest, index) => ({
        firstName: guest[0],
        lastName: guest[1],
        email: `${guest[0].toLowerCase()}.${guest[1].toLowerCase()}@example.com`,
        phone: `600000${(index + 10).toString().padStart(3, "0")}`,
        document: `DOC${2000 + index}`,
        nationality: ["Germany", "France", "Italy", "Spain"][index % 4],
        notes: index % 3 === 0 ? "VIP arrival" : "",
        birthDate: new Date(1988 + (index % 8), index % 12, 1 + (index % 27))
      }))
    );

    const occupiedOrDirtyRooms = rooms.filter(
      (room) => room.status === "Occupied" || room.status === "Dirty"
    );

    const bookingData = occupiedOrDirtyRooms.slice(0, 14).map((room, index) => ({
      property: room.property,
      room: room._id,
      guest: guests[index % guests.length]._id,
      checkIn: new Date(`2026-04-${String(3 + index).padStart(2, "0")}`),
      checkOut: new Date(`2026-04-${String(6 + index).padStart(2, "0")}`),
      numberOfGuests: index % 2 === 0 ? 2 : 1,
      totalPrice: room.pricePerNight * 3,
      status: index < 6 ? "Checked-in" : "Confirmed"
    }));

    await Booking.insertMany(bookingData);
    console.log(`${bookingData.length} bookings seeded`);

    await mongoose.disconnect();
    console.log("Seeding complete. DB connection closed.");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();