const { Schema, model } = require("mongoose");

const propertySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Property name is required"],
      trim: true
    },
    type: {
      type: String,
      enum: ["Hotel", "Villa"],
      required: [true, "Property type is required"]
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true
    },
    image: {
      type: String,
      required: [true, "Property image is required"]
    },
    description: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ["Active", "Booked", "Maintenance"],
      default: "Active"
    }
  },
  {
    timestamps: true
  }
);

module.exports = model("Property", propertySchema);