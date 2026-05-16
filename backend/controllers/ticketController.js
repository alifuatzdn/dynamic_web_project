const mongoose = require("mongoose");
const Ticket = require("../models/Ticket");
const Flight = require("../models/Flight");
const User = require("../models/User");

async function createTicket(req, res) {
  try {
    const { flight_id, passenger_name, passenger_email, passenger_phone, seat_count } = req.body;

    if (!flight_id || !passenger_name || !passenger_email || !passenger_phone) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const seatsToBook = Number(seat_count || 1);
    if (!Number.isInteger(seatsToBook) || seatsToBook < 1) {
      return res.status(400).json({ message: "Number of seats must be a positive integer." });
    }

    if (!mongoose.Types.ObjectId.isValid(flight_id)) {
      return res.status(400).json({ message: "Invalid flight id." });
    }

    const flight = await Flight.findById(flight_id);

    if (!flight) {
      return res.status(404).json({ message: "Flight not found." });
    }

    if (flight.seatsAvailable < seatsToBook) {
      return res.status(409).json({ message: "Not enough seats available." });
    }

    flight.seatsAvailable -= seatsToBook;
    await flight.save();

    const totalPrice = Number(flight.price) * seatsToBook;

    const ticket = await Ticket.create({
      user: req.user.id,
      flight: flight_id,
      passengerName: passenger_name,
      passengerEmail: passenger_email,
      passengerPhone: passenger_phone,
      seatCount: seatsToBook,
      totalPrice,
    });

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('user')
      .populate({
        path: 'flight',
        populate: {
          path: 'fromCity toCity'
        }
      });

    return res.status(201).json({
      status: 201,
      message: "Ticket booked successfully.",
      ticket: populatedTicket,
      seats_available: flight.seatsAvailable,
      total_price: totalPrice
    });

  } catch (error) {
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
}

async function getAllTickets(req, res) {
  try {
    const tickets = await Ticket.find({})
      .populate('user')
      .populate({
        path: 'flight',
        populate: {
          path: 'fromCity toCity'
        }
      })
      .sort({ _id: -1 });

    const mappedTickets = tickets.map(t => ({
      ...t.toObject(),
      id: t._id,
      flightId: t.flight._id
    }));

    return res.status(200).json(mappedTickets);
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
}

async function getUserTickets(req, res) {
  try {
    const { username } = req.params;
    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    if (req.user.role !== "admin" && req.user.username !== username) {
      return res.status(403).json({ message: "Access denied." });
    }

    let targetUserId = req.user.id;
    if (req.user.role === "admin") {
      const targetUser = await User.findOne({ username: String(username).trim() }).select('_id');
      if (!targetUser) {
        return res.status(404).json({ message: "User not found." });
      }
      targetUserId = targetUser._id;
    }

    const tickets = await Ticket.find({ user: targetUserId })
      .populate('user')
      .populate({
        path: 'flight',
        populate: {
          path: 'fromCity toCity'
        }
      })
      .sort({ _id: -1 });

    const mappedTickets = tickets.map(t => ({
      ...t.toObject(),
      id: t._id,
      flightId: t.flight._id
    }));

    return res.status(200).json(mappedTickets);
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
}

module.exports = {
  createTicket,
  getAllTickets,
  getUserTickets,
};