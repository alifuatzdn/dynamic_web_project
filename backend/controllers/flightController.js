const mongoose = require('mongoose');
const Flight = require('../models/Flight');
const { validateFlightPayload, hasSchedulingConflict } = require('../utils/flightUtils');

function mapFlight(flight) {
  const flightObj = flight.toObject ? flight.toObject() : flight;
  return {
    ...flightObj,
    id: flightObj._id,
    fromCityId: flightObj.fromCity?._id,
    toCityId: flightObj.toCity?._id
  };
}

async function createFlight(req, res) {
  try {
    // Validate everything early so we don't create bad flights.
    const validation = await validateFlightPayload(req.body);
    if (!validation.valid) {
      return res.status(validation.status).json({ message: validation.message });
    }

    const { flight_number, from_city, to_city, departureDate, arrivalDate, price, seats_total } = validation.normalized;
    // Avoid double-booking the same airport time slot.
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
    return res.status(201).json({ message: 'Flight created successfully.', flight: mapFlight(populatedFlight) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Flight number already exists or conflicting schedule.' });
    }
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
}

async function listFlights(req, res) {
  try {
    const { from_city, to_city, date, page, q, include_past } = req.query;
    const pageNum = parseInt(page) || 1;
    const limit = 10;
    const query = {};
    const includePast = String(include_past || '').toLowerCase() === 'true' || String(include_past) === '1';

    if (from_city) query.fromCity = from_city;
    if (to_city) query.toCity = to_city;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);
      query.departureTime = { $gte: startOfDay, $lte: endOfDay };
    }

    // Default to upcoming flights unless caller explicitly asks for past ones.
    if (!includePast) {
      const now = new Date();
      if (query.departureTime && query.departureTime.$gte) {
        query.departureTime.$gte = query.departureTime.$gte.getTime() > now.getTime()
          ? query.departureTime.$gte
          : now;
      } else if (query.departureTime) {
        query.departureTime.$gte = now;
      } else {
        query.departureTime = { $gte: now };
      }
    }

    // Simple search by flight number or id.
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
    return res.status(200).json({ data: flights.map(mapFlight), page: pageNum, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
}

async function getFlightById(req, res) {
  try {
    const { id } = req.params;
    // Mongoose will throw on bad ids, so I guard it here.
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid flight id.' });
    }

    const flight = await Flight.findById(id).populate('fromCity').populate('toCity');
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found.' });
    }

    return res.status(200).json(mapFlight(flight));
  } catch (error) {
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
}

async function updateFlight(req, res) {
  try {
    const { id } = req.params;
    // Fail fast when the id is not even a valid ObjectId.
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
    // Same conflict check as create, but we ignore this flight itself.
    const conflictResult = await hasSchedulingConflict({ from_city, to_city, departureDate, arrivalDate, excludeFlightId: id });
    if (conflictResult.conflict) {
      return res.status(409).json({ message: conflictResult.message });
    }

    // Prevent shrinking capacity below already booked seats.
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
      flight: mapFlight(populatedFlight)
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
    // Quick input sanity check.
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