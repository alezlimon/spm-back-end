const { Schema, model } = require("mongoose");

const roomSchema = new Schema(
  {
    roomNumber: { 
      type: String, 
      required: [true, "Room number is required"], 
      unique: true
    },
    type: { 
      type: String, 
      enum: ["Single", "Double", "Suite", "Dorm"],
      default: "Double" 
    },
    pricePerNight: { 
      type: Number, 
      required: [true, "Price per night is required"] 
    },
    description: {
      type: String
    },
    status: { 
      type: String, 
      enum: ["Available", "Occupied", "Dirty", "Maintenance"], 
      default: "Available" 
    }
  },
  {
    timestamps: true
  }
);

module.exports = model("Room", roomSchema);