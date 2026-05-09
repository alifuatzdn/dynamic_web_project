const prisma = require("../config/prisma");

async function createTicket(req, res) {
  try {
    const { flight_id, passenger_name, passenger_email, passenger_phone, seat_count } = req.body;

    if (!flight_id || !passenger_name || !passenger_email || !passenger_phone) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const seatsToBook = Number(seat_count || 1);
    if (!Number.isInteger(seatsToBook) || seatsToBook < 1) {
      return res.status(400).json({ message: "seat_count must be a positive integer." });
    }

    const flightId = Number(flight_id);
    if (!Number.isInteger(flightId)) {
      return res.status(400).json({ message: "Invalid flight id." });
    }

    const result = await prisma.$transaction(async (tx) => {
      const flight = await tx.flight.findUnique({
        where: { id: BigInt(flightId) },
        select: {
          id: true,
          price: true,
          seatsAvailable: true,
        },
      });

      if (!flight) {
        return { status: 404, message: "Flight not found." };
      }

      const updateResult = await tx.flight.updateMany({
        where: {
          id: BigInt(flightId),
          seatsAvailable: { gte: seatsToBook },
        },
        data: {
          seatsAvailable: { decrement: seatsToBook },
        },
      });

      if (updateResult.count === 0) {
        return { status: 409, message: "Not enough seats available or invalid flight." };
      }

      const totalPrice = Number(flight.price) * seatsToBook;

      const ticket = await tx.ticket.create({
        data: {
          flightId: BigInt(flightId),
          passengerName: passenger_name,
          passengerEmail: passenger_email,
          passengerPhone: passenger_phone,
          seatCount: seatsToBook,
          totalPrice,
        },
      });

      return {
        status: 201,
        message: "Ticket booked successfully.",
        ticket,
        seats_available: flight.seatsAvailable - seatsToBook,
      };
    });

    if (result.status !== 201) {
      return res.status(result.status).json({ message: result.message });
    }

    return res.status(201).json({
      message: result.message,
      ticket: {
        _id: Number(result.ticket.id),
        flight: flightId,
        passenger_name: result.ticket.passengerName,
        passenger_email: result.ticket.passengerEmail,
        passenger_phone: result.ticket.passengerPhone,
        seat_count: result.ticket.seatCount,
        total_price: Number(result.ticket.totalPrice),
        status: result.ticket.status,
      },
      seats_available: result.seats_available,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
}

async function getAllTickets(req, res) {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        flight: {
          include: {
            fromCity: true,
            toCity: true
          }
        }
      },
      orderBy: { id: 'desc' }
    });

    // Format BigInt to string/number
    const formatted = tickets.map(t => ({
      ...t,
      id: Number(t.id),
      flightId: Number(t.flightId),
      totalPrice: Number(t.totalPrice),
      flight: {
        ...t.flight,
        id: Number(t.flight.id),
        price: Number(t.flight.price)
      }
    }));
    return res.status(200).json(formatted);
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

    const tickets = await prisma.ticket.findMany({
      where: { passengerName: username }, // Using passengerName as linkage since schema has no userId
      include: {
        flight: {
          include: {
            fromCity: true,
            toCity: true
          }
        }
      },
      orderBy: { id: 'desc' }
    });

    const formatted = tickets.map(t => ({
      ...t,
      id: Number(t.id),
      flightId: Number(t.flightId),
      totalPrice: Number(t.totalPrice),
      flight: {
        ...t.flight,
        id: Number(t.flight.id),
        price: Number(t.flight.price)
      }
    }));
    return res.status(200).json(formatted);
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
}

module.exports = {
  createTicket,
  getAllTickets,
  getUserTickets,
};
