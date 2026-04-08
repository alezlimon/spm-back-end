const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/spm";

mongoose
  .connect(MONGO_URI)
  .then((connection) => {
    const dbName = connection.connections[0].name;
    console.log(`Connected to Mongo! Database name: "${dbName}"`);
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });