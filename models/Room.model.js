const { Schema, model } = require("mongoose");

const roomSchema = new Schema(
  {
    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Property is required"],
    },
    roomNumber: {
      type: String,
      required: [true, "Room number is required"],
    },
    type: {
      type: String,
      enum: ["Single", "Double", "Suite", "Dorm", "Deluxe", "Familiar", "Twins"],
      default: "Double",
    },
    pricePerNight: {
      type: Number,
      required: [true, "Price per night is required"],
    },
    description: { type: String },
    status: {
      type: String,
      enum: ["Available", "Occupied", "Dirty", "Maintenance"],
      default: "Available",
    },
  },
  { timestamps: true }
);

// Unique room number per property
roomSchema.index({ property: 1, roomNumber: 1 }, { unique: true });

module.exports = model("Room", roomSchema);