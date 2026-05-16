const mongoose = require('mongoose');
const City = require('../models/City');
const Flight = require('../models/Flight');

function isValidDate(value) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

async function validateFlightPayload(payload) {
  const { flight_number, from_city, to_city, departure_time, arrival_time, price, seats_total } = payload;

  if (!flight_number || !from_city || !to_city || !departure_time || !arrival_time || price === undefined || seats_total === undefined) {
    return { valid: false, status: 400, message: 'Missing required fields.' };
  }

  if (!isValidDate(departure_time) || !isValidDate(arrival_time)) {
    return { valid: false, status: 400, message: 'Invalid date format.' };
  }

  const departureDate = new Date(departure_time);
  const arrivalDate = new Date(arrival_time);

  if (departureDate >= arrivalDate) {
    return { valid: false, status: 400, message: 'Arrival time must be after departure time.' };
  }

  if (String(from_city) === String(to_city)) {
    return { valid: false, status: 400, message: 'from_city and to_city cannot be the same.' };
  }

  if (!mongoose.Types.ObjectId.isValid(from_city) || !mongoose.Types.ObjectId.isValid(to_city)) {
    return { valid: false, status: 400, message: 'City ids must be valid object ids.' };
  }

  const cityCount = await City.countDocuments({ _id: { $in: [from_city, to_city] } });
  if (cityCount !== 2) {
    return { valid: false, status: 400, message: 'Invalid city id(s).' };
  }

  if (Number(price) < 0 || Number(seats_total) < 1) {
    return { valid: false, status: 400, message: 'price and seats_total must be valid positive values.' };
  }

  return {
    valid: true,
    normalized: {
      flight_number: String(flight_number).trim(),
      from_city,
      to_city,
      departureDate,
      arrivalDate,
      price: Number(price),
      seats_total: Number(seats_total)
    }
  };
}

async function hasSchedulingConflict({ from_city, to_city, departureDate, arrivalDate, excludeFlightId }) {
  const queryBase = excludeFlightId ? { _id: { $ne: excludeFlightId } } : {};

  // Truncate to the start of the minute to catch any flights falling within the same exact UI minute (ignoring seconds)
  const depStart = new Date(departureDate);
  depStart.setSeconds(0, 0);
  const depEnd = new Date(depStart.getTime() + 60000);

  const arrStart = new Date(arrivalDate);
  arrStart.setSeconds(0, 0);
  const arrEnd = new Date(arrStart.getTime() + 60000);

  // A city can only handle one flight operation at any exact time (departure or arrival)
  const departureConflict = await Flight.findOne({
    ...queryBase,
    $or: [
      { fromCity: from_city, departureTime: { $gte: depStart, $lt: depEnd } },
      { toCity: from_city, arrivalTime: { $gte: depStart, $lt: depEnd } }
    ]
  }).select('_id');

  if (departureConflict) {
    return { conflict: true, message: 'Scheduling conflict: the departure airport is already busy at this time.' };
  }

  const arrivalConflict = await Flight.findOne({
    ...queryBase,
    $or: [
      { toCity: to_city, arrivalTime: { $gte: arrStart, $lt: arrEnd } },
      { fromCity: to_city, departureTime: { $gte: arrStart, $lt: arrEnd } }
    ]
  }).select('_id');

  if (arrivalConflict) {
    return { conflict: true, message: 'Scheduling conflict: the arrival airport is already busy at this time.' };
  }

  return { conflict: false };
}

module.exports = { isValidDate, validateFlightPayload, hasSchedulingConflict };