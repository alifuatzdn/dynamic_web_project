const prisma = require("../config/prisma");

function isValidDate(value) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function mapFlightRecord(flight) {
  return {
    _id: Number(flight.id),
    flight_number: flight.flightNumber,
    from_city: {
      _id: flight.fromCity.id,
      name: flight.fromCity.name,
    },
    to_city: {
      _id: flight.toCity.id,
      name: flight.toCity.name,
    },
    departure_time: flight.departureTime,
    arrival_time: flight.arrivalTime,
    price: Number(flight.price),
    seats_total: flight.seatsTotal,
    seats_available: flight.seatsAvailable,
  };
}

async function validateFlightPayload(payload) {
  const {
    flight_number,
    from_city,
    to_city,
    departure_time,
    arrival_time,
    price,
    seats_total,
  } = payload;

  if (
    !flight_number ||
    !from_city ||
    !to_city ||
    !departure_time ||
    !arrival_time ||
    price === undefined ||
    seats_total === undefined
  ) {
    return { valid: false, status: 400, message: "Missing required fields." };
  }

  if (!isValidDate(departure_time) || !isValidDate(arrival_time)) {
    return { valid: false, status: 400, message: "Invalid date format." };
  }

  const departureDate = new Date(departure_time);
  const arrivalDate = new Date(arrival_time);

  if (departureDate >= arrivalDate) {
    return { valid: false, status: 400, message: "Arrival time must be after departure time." };
  }

  if (String(from_city) === String(to_city)) {
    return { valid: false, status: 400, message: "from_city and to_city cannot be the same." };
  }

  const fromCityId = Number(from_city);
  const toCityId = Number(to_city);

  if (!Number.isInteger(fromCityId) || !Number.isInteger(toCityId)) {
    return { valid: false, status: 400, message: "City ids must be integers." };
  }

  const cityCount = await prisma.city.count({
    where: {
      id: { in: [fromCityId, toCityId] },
    },
  });

  if (cityCount !== 2) {
    return { valid: false, status: 400, message: "Invalid city id(s)." };
  }

  if (Number(price) < 0 || Number(seats_total) < 1) {
    return { valid: false, status: 400, message: "price and seats_total must be valid positive values." };
  }

  return {
    valid: true,
    normalized: {
      flight_number: String(flight_number).trim(),
      from_city: fromCityId,
      to_city: toCityId,
      departureDate,
      arrivalDate,
      price: Number(price),
      seats_total: Number(seats_total),
    },
  };
}

async function hasSchedulingConflict({ from_city, to_city, departureDate, arrivalDate, excludeFlightId }) {
  const departureConflict = await prisma.flight.findFirst({
    where: {
      fromCityId: from_city,
      departureTime: departureDate,
      ...(excludeFlightId ? { id: { not: BigInt(excludeFlightId) } } : {}),
    },
    select: { id: true },
  });

  if (departureConflict) {
    return {
      conflict: true,
      message: "Scheduling conflict: another flight already departs from this city at this time.",
    };
  }

  const arrivalConflict = await prisma.flight.findFirst({
    where: {
      toCityId: to_city,
      arrivalTime: arrivalDate,
      ...(excludeFlightId ? { id: { not: BigInt(excludeFlightId) } } : {}),
    },
    select: { id: true },
  });

  if (arrivalConflict) {
    return {
      conflict: true,
      message: "Scheduling conflict: another flight already arrives to this city at this time.",
    };
  }

  return { conflict: false };
}

async function createFlight(req, res) {
  try {
    const validation = await validateFlightPayload(req.body);
    if (!validation.valid) {
      return res.status(validation.status).json({ message: validation.message });
    }

    const { flight_number, from_city, to_city, departureDate, arrivalDate, price, seats_total } = validation.normalized;

    const conflictResult = await hasSchedulingConflict({
      from_city,
      to_city,
      departureDate,
      arrivalDate,
    });

    if (conflictResult.conflict) {
      return res.status(409).json({ message: conflictResult.message });
    }

    const createdFlight = await prisma.flight.create({
      data: {
        flightNumber: flight_number,
        fromCityId: from_city,
        toCityId: to_city,
        departureTime: departureDate,
        arrivalTime: arrivalDate,
        price,
        seatsTotal: seats_total,
        seatsAvailable: seats_total,
      },
      include: {
        fromCity: true,
        toCity: true,
      },
    });

    return res.status(201).json(mapFlightRecord(createdFlight));
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "flight_number already exists." });
    }

    return res.status(500).json({ message: "Server error.", error: error.message });
  }
}

async function listFlights(req, res) {
  try {
    const flights = await prisma.flight.findMany({
      include: {
        fromCity: true,
        toCity: true,
      },
      orderBy: {
        departureTime: "asc",
      },
    });

    return res.status(200).json(flights.map(mapFlightRecord));
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
}

async function searchFlights(req, res) {
  try {
    const { from_city, to_city, date } = req.query;
    const where = {};

    if (from_city) {
      where.fromCityId = Number(from_city);
    }

    if (to_city) {
      where.toCityId = Number(to_city);
    }

    if (date) {
      if (!isValidDate(date)) {
        return res.status(400).json({ message: "Invalid date query format." });
      }

      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      where.departureTime = {
        gte: dayStart,
        lt: dayEnd,
      };
    }

    const flights = await prisma.flight.findMany({
      where,
      include: {
        fromCity: true,
        toCity: true,
      },
      orderBy: {
        departureTime: "asc",
      },
    });

    return res.status(200).json(flights.map(mapFlightRecord));
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
}

async function getFlightById(req, res) {
  try {
    const flightId = Number(req.params.id);
    if (!Number.isInteger(flightId)) {
      return res.status(400).json({ message: "Invalid flight id." });
    }

    const flight = await prisma.flight.findUnique({
      where: { id: BigInt(flightId) },
      include: {
        fromCity: true,
        toCity: true,
      },
    });

    if (!flight) {
      return res.status(404).json({ message: "Flight not found." });
    }

    return res.status(200).json(mapFlightRecord(flight));
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
}

async function updateFlight(req, res) {
  try {
    const flightId = Number(req.params.id);
    if (!Number.isInteger(flightId)) {
      return res.status(400).json({ message: "Invalid flight id." });
    }

    const flight = await prisma.flight.findUnique({
      where: { id: BigInt(flightId) },
      select: {
        id: true,
        seatsTotal: true,
        seatsAvailable: true,
      },
    });

    if (!flight) {
      return res.status(404).json({ message: "Flight not found." });
    }

    const validation = await validateFlightPayload(req.body);
    if (!validation.valid) {
      return res.status(validation.status).json({ message: validation.message });
    }

    const { flight_number, from_city, to_city, departureDate, arrivalDate, price, seats_total } = validation.normalized;

    const conflictResult = await hasSchedulingConflict({
      from_city,
      to_city,
      departureDate,
      arrivalDate,
      excludeFlightId: flight.id,
    });

    if (conflictResult.conflict) {
      return res.status(409).json({ message: conflictResult.message });
    }

    const soldSeats = flight.seatsTotal - flight.seatsAvailable;
    if (seats_total < soldSeats) {
      return res.status(400).json({
        message: "seats_total cannot be lower than already sold seats.",
      });
    }

    const updatedFlight = await prisma.flight.update({
      where: { id: flight.id },
      data: {
        flightNumber: flight_number,
        fromCityId: from_city,
        toCityId: to_city,
        departureTime: departureDate,
        arrivalTime: arrivalDate,
        price,
        seatsTotal: seats_total,
        seatsAvailable: seats_total - soldSeats,
      },
      include: {
        fromCity: true,
        toCity: true,
      },
    });

    return res.status(200).json(mapFlightRecord(updatedFlight));
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "flight_number already exists." });
    }
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
}

async function deleteFlight(req, res) {
  try {
    const flightId = Number(req.params.id);
    if (!Number.isInteger(flightId)) {
      return res.status(400).json({ message: "Invalid flight id." });
    }

    const flight = await prisma.flight.findUnique({
      where: { id: BigInt(flightId) },
      select: { id: true },
    });

    if (!flight) {
      return res.status(404).json({ message: "Flight not found." });
    }

    const ticketCount = await prisma.ticket.count({
      where: { flightId: BigInt(flightId) },
    });

    if (ticketCount > 0) {
      return res.status(409).json({
        message: "Flight cannot be deleted because it has related tickets.",
      });
    }

    await prisma.flight.delete({
      where: { id: BigInt(flightId) },
    });

    return res.status(200).json({ message: "Flight deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
}

module.exports = {
  createFlight,
  listFlights,
  searchFlights,
  getFlightById,
  updateFlight,
  deleteFlight,
};
