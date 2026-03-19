const { Schema, model } = require("mongoose");

const bookingSchema = new Schema(
  {
    room: { type: Schema.Types.ObjectId, ref: "Room", required: true },
    guest: { type: Schema.Types.ObjectId, ref: "Guest", required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    numberOfGuests: { type: Number, default: 1 },
    totalPrice: { type: Number },
    status: { 
      type: String, 
      enum: ["Confirmed", "Checked-in", "Checked-out", "Cancelled"], 
      default: "Confirmed" 
    }
  },
  { timestamps: true }
);

module.exports = model("Booking", bookingSchema);
