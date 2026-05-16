const mongoose = require('mongoose');
const Flight = require('../models/Flight');
const { validateFlightPayload, hasSchedulingConflict } = require('../utils/flightUtils');

async function createFlight(req, res) {
  try {
    const validation = await validateFlightPayload(req.body);
    if (!validation.valid) {
      return res.status(validation.status).json({ message: validation.message });
    }

    const { flight_number, from_city, to_city, departureDate, arrivalDate, price, seats_total } = validation.normalized;
    const conflictResult = await hasSchedulingConflict({ from_city, to_city, departureDate, arrivalDate });
    if (conflictResult.conflict) {
      return res.status(409).json({ message: conflictResult.message });
    }

    const createdFlight = await Flight.create({
      flightNumber: flight_number,
      fromCity: from_city,
      toCity: to_city,
      departureTime: departureDate,
      arrivalTime: arrivalDate,
      price,
      seatsTotal: seats_total,
      seatsAvailable: seats_total
    });

    const populatedFlight = await Flight.findById(createdFlight._id).populate('fromCity').populate('toCity');
    const mappedFlight = {
      ...populatedFlight.toObject(),
      id: populatedFlight._id,
      fromCityId: populatedFlight.fromCity._id,
      toCityId: populatedFlight.toCity._id
    };

    return res.status(201).json({ message: 'Flight created successfully.', flight: mappedFlight });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Flight number already exists or conflicting schedule.' });
    }
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
}

async function listFlights(req, res) {
  try {
    const { from_city, to_city, date, page, q } = req.query;
    const pageNum = parseInt(page) || 1;
    const limit = 10;
    const query = {};

    if (from_city) query.fromCity = from_city;
    if (to_city) query.toCity = to_city;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);
      query.departureTime = { $gte: startOfDay, $lte: endOfDay };
    }

    const trimmedQuery = String(q || '').trim();
    if (trimmedQuery) {
      const regex = new RegExp(trimmedQuery, 'i');
      const orFilters = [{ flightNumber: regex }];
      if (mongoose.Types.ObjectId.isValid(trimmedQuery)) {
        orFilters.push({ _id: trimmedQuery });
      }
      query.$or = orFilters;
    }

    const flights = await Flight.find(query)
      .populate('fromCity')
      .populate('toCity')
      .sort({ departureTime: 1 })
      .skip((pageNum - 1) * limit)
      .limit(limit);

    const total = await Flight.countDocuments(query);
    const mappedFlights = flights.map(f => ({
      ...f.toObject(),
      id: f._id,
      fromCityId: f.fromCity._id,
      toCityId: f.toCity._id
    }));

    return res.status(200).json({ data: mappedFlights, page: pageNum, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
}

async function getFlightById(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid flight id.' });
    }

    const flight = await Flight.findById(id).populate('fromCity').populate('toCity');
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found.' });
    }

    return res.status(200).json({
      ...flight.toObject(),
      id: flight._id,
      fromCityId: flight.fromCity._id,
      toCityId: flight.toCity._id
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
}

async function updateFlight(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid flight id.' });
    }

    const flight = await Flight.findById(id);
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found.' });
    }

    const validation = await validateFlightPayload(req.body);
    if (!validation.valid) {
      return res.status(validation.status).json({ message: validation.message });
    }

    const { flight_number, from_city, to_city, departureDate, arrivalDate, price, seats_total } = validation.normalized;
    const conflictResult = await hasSchedulingConflict({ from_city, to_city, departureDate, arrivalDate, excludeFlightId: id });
    if (conflictResult.conflict) {
      return res.status(409).json({ message: conflictResult.message });
    }

    const booked = flight.seatsTotal - flight.seatsAvailable;
    if (seats_total < booked) {
      return res.status(400).json({ message: 'Cannot reduce seats below ' + booked + ' booked tickets.' });
    }

    flight.flightNumber = flight_number;
    flight.fromCity = from_city;
    flight.toCity = to_city;
    flight.departureTime = departureDate;
    flight.arrivalTime = arrivalDate;
    flight.price = price;
    flight.seatsTotal = seats_total;
    flight.seatsAvailable = seats_total - booked;

    await flight.save();

    const populatedFlight = await Flight.findById(flight._id).populate('fromCity').populate('toCity');
    return res.status(200).json({
      message: 'Flight updated successfully.',
      flight: {
        ...populatedFlight.toObject(),
        id: populatedFlight._id,
        fromCityId: populatedFlight.fromCity._id,
        toCityId: populatedFlight.toCity._id
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Flight number already exists or conflicting schedule.' });
    }
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
}

async function deleteFlight(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid flight id.' });
    }

    const flight = await Flight.findByIdAndDelete(id);
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found.' });
    }

    return res.status(200).json({ message: 'Flight deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
}

module.exports = { createFlight, listFlights, getFlightById, updateFlight, deleteFlight };