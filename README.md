# SPM Back-End (Hotel Property Management System)

## Overview
This is a robust, production-ready Node.js/Express/Mongoose backend for a Hotel Property Management System (PMS). It provides secure, modular, and scalable RESTful APIs for managing rooms, bookings, and users, with JWT-based authentication and role-based access control.

---

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [API Endpoints](#api-endpoints)
  - [Auth](#auth)
  - [Rooms](#rooms)
  - [Bookings](#bookings)
- [Models](#models)
- [Middleware](#middleware)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Best Practices](#best-practices)
- [Contributing](#contributing)

---

## Features
- Modular Express routing (rooms, bookings, auth)
- MongoDB/Mongoose models with strong validation
- JWT authentication and role-based access
- CORS, logging, and security middleware
- Centralized error handling
- Ready for production and local development

---

## Architecture
```
spm-back-end/
├── app.js
├── server.js
├── package.json
├── config/
│   └── index.js
├── db/
│   └── index.js
├── error-handling/
│   └── index.js
├── middleware/
│   └── jwt.middleware.js
├── models/
│   ├── Room.model.js
│   ├── User.model.js
│   └── Booking.model.js
├── routes/
│   ├── auth.routes.js
│   ├── index.routes.js
│   ├── room.routes.js
│   └── booking.routes.js
└── ...
```

---

## Tech Stack
- Node.js 18+
- Express 5
- MongoDB (Mongoose ODM)
- JWT (jsonwebtoken, express-jwt)
- bcrypt (password hashing)
- dotenv, morgan, cors, cookie-parser

---

## Setup & Installation
1. **Clone the repo:**
   ```bash
   git clone https://github.com/alezlimon/spm-back-end.git
   cd spm-back-end
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure environment:**
   - Copy `.env.example` to `.env` and set:
     - `MONGODB_URI` (MongoDB connection string)
     - `JWT_SECRET` (for signing tokens)
     - `ORIGIN` (frontend URL, e.g. http://localhost:3000)
4. **Start the server:**
   - Development: `npm run dev`
   - Production: `npm start`

---

## Environment Variables
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — Secret for JWT signing
- `ORIGIN` — Allowed CORS origin (frontend URL)
- `PORT` — (optional) Server port (default: 5005)

---

## Scripts
- `npm run dev` — Start with nodemon (auto-reload)
- `npm start` — Start in production mode

---

## API Endpoints

### Auth
- `POST /auth/signup` — Register new user
- `POST /auth/login` — Login, returns JWT
- `GET /auth/verify` — Verify JWT token

### Rooms
- `GET /api/rooms` — List all rooms
- `POST /api/rooms` — Create new room
- `PUT /api/rooms/:id` — Update room
- `DELETE /api/rooms/:id` — Delete room

### Bookings
- `GET /api/bookings` — List all bookings
- `POST /api/bookings` — Create new booking

---

## Models

### User.model.js
- `username` (String, required, unique)
- `email` (String, required, unique)
- `password` (String, hashed)
- `role` (String, enum: ["admin", "staff", "guest"], default: "guest")

### Room.model.js
- `roomNumber` (String, required, unique)
- `type` (String, enum: ["Single", "Double", "Suite", "Dorm"])
- `pricePerNight` (Number, required)
- `description` (String)
- `isClean` (Boolean, default: true)
- `status` (String, enum: ["Available", "Occupied", "Maintenance"], default: "Available")

### Booking.model.js
- `room` (ObjectId, ref: Room, required)
- `guestName` (String, required)
- `checkIn` (Date, required)
- `checkOut` (Date, required)
- `numberOfGuests` (Number, default: 1)
- `totalPrice` (Number)
- `status` (String, enum: ["Confirmed", "Checked-in", "Checked-out", "Cancelled"], default: "Confirmed")

---

## Middleware
- **JWT Auth**: `middleware/jwt.middleware.js` — Protects routes, verifies tokens
- **CORS**: Configured for frontend origin
- **Logger**: Morgan for request logging
- **Error Handling**: Centralized in `error-handling/index.js`

---

## Error Handling
- All errors are caught and formatted as JSON responses
- 404 handler for unknown routes
- Validation errors from Mongoose are returned with details

---

## Testing
- Use tools like Thunder Client, Postman, or Insomnia
- Example requests:
  - Register: `POST /auth/signup` with `{ username, email, password }`
  - Login: `POST /auth/login` with `{ email, password }`
  - Create Room: `POST /api/rooms` with `{ roomNumber, type, pricePerNight }`
  - Create Booking: `POST /api/bookings` with `{ room, guestName, checkIn, checkOut, numberOfGuests }`

---

## Best Practices
- Use environment variables for secrets and config
- Validate all incoming data (see Mongoose schemas)
- Protect sensitive routes with JWT middleware
- Use role-based access for admin/staff/guest
- Modularize code for maintainability
- Commit often and use clear messages

---

## Contributing
1. Fork the repo
2. Create a feature branch
3. Commit your changes
4. Open a pull request

---

## License
MIT
