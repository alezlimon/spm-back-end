const { Schema, model } = require("mongoose");

const propertySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Property name is required"],
      unique: true,
      trim: true
    },
    description: {
      type: String
    },
    location: {
      type: String
    },
    image: {
      type: String
    },
    propertyType: {
      type: String,
      enum: ["hotel", "villa"],
      default: "hotel"
    }
  },
  { timestamps: true }
);

module.exports = model("Property", propertySchema);