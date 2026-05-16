const mongoose = require("mongoose");

// Flight schema mirrors the booking form and admin panel.
const flightSchema = new mongoose.Schema({
  flightNumber: {
    type: String,
    required: true,
    unique: true
  },
  fromCity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  },
  toCity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  },
  departureTime: {
    type: Date,
    required: true
  },
  arrivalTime: {
    type: Date,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  seatsTotal: {
    type: Number,
    required: true
  },
  seatsAvailable: {
    type: Number,
    required: true
  }
});

// Unique constraint on fromCity + departureTime and toCity + arrivalTime.
flightSchema.index({ fromCity: 1, departureTime: 1 }, { unique: true });
flightSchema.index({ toCity: 1, arrivalTime: 1 }, { unique: true });

module.exports = mongoose.model("Flight", flightSchema);