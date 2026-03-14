const { Schema, model } = require("mongoose");

const roomSchema = new Schema(
  {
    roomNumber: { 
      type: String, 
      required: [true, "El número de habitación es obligatorio"], 
      unique: true
    },
    type: { 
      type: String, 
      enum: ["Single", "Double", "Suite", "Dorm"],
      default: "Double" 
    },
    pricePerNight: { 
      type: Number, 
      required: [true, "El precio por noche es obligatorio"] 
    },
    description: {
      type: String
    },
    isClean: { 
      type: Boolean, 
      default: true 
    },
    status: { 
      type: String, 
      enum: ["Available", "Occupied", "Maintenance"], 
      default: "Available" 
    }
  },
  {
    timestamps: true
  }
);

module.exports = model("Room", roomSchema);