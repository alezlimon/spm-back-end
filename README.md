# Reva — Backend

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

## Overview
This is the backend for Reva, a hotel operations dashboard built with Node.js, Express, and MongoDB. It handles all business logic, authentication, and data management for rooms, bookings, guests, billing, and properties.

## Main Features
- REST API for properties, rooms, bookings, guests, and billing
- JWT authentication
- Mongoose schema modeling
- Seeded data available for demo/testing purposes
- Property logic supports both hotel-style and villa-style behavior

## Tech Stack
- Node.js
- Express
- MongoDB
- Mongoose
- JWT authentication
- bcrypt

## Run Locally
```bash
cd spm-back-end
npm install
npm run dev
```

## Environment Variables
Create a `.env` file with:

MONGODB_URI=your_mongo_uri
JWT_SECRET=your_secret
ORIGIN=http://localhost:5173
PORT=5005

## Notes
- Business logic is mainly handled here
- Data can be seeded for demo/testing purposes
- Properties support different operational logic, including hotel and villa behavior

## Credits
- Luana Aguilo
- Alejandro Perez

## Related
- [Reva Frontend](https://github.com/alezlimon/spm-front-end)

## License
This project is licensed under the MIT License.