const { Schema, model } = require("mongoose");

const guestSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    document: { type: String, required: true, unique: true }, // Pasaporte/DNI
    nationality: { type: String },
    notes: { type: String }
    ,birthDate: { type: Date, required: true }
  },
  { timestamps: true }
);

module.exports = model("Guest", guestSchema);
