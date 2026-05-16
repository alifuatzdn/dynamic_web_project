const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  flight: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flight',
    required: true
  },
  passengerName: {
    type: String,
    required: true
  },
  passengerEmail: {
    type: String,
    required: true
  },
  passengerPhone: {
    type: String,
    required: true
  },
  seatCount: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['CONFIRMED', 'CANCELLED'],
    default: 'CONFIRMED'
  }
});

module.exports = mongoose.model("Ticket", ticketSchema);