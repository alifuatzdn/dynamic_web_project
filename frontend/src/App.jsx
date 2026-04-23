import { useEffect, useState } from "react";
import {
  adminRegister,
  adminLogin,
  createFlightAdmin,
  createTicket,
  deleteFlightAdmin,
  getAllFlights,
  getCities,
  searchFlights,
  updateFlightAdmin,
} from "./api";

function formatDateTime(value) {
  return new Date(value).toLocaleString("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function App() {
  const [page, setPage] = useState("user");
  const [view, setView] = useState("search");
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState({
    from_city: "",
    to_city: "",
    date: "",
  });
  const [flights, setFlights] = useState([]);
  const [allFlights, setAllFlights] = useState([]);
  const [allFlightsLoading, setAllFlightsLoading] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    passenger_name: "",
    passenger_email: "",
    passenger_phone: "",
    seat_count: 1,
  });
  const [bookingResult, setBookingResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [adminCredentials, setAdminCredentials] = useState({ username: "", password: "" });
  const [adminAuthMode, setAdminAuthMode] = useState("login");
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminFlights, setAdminFlights] = useState([]);
  const [editingFlightId, setEditingFlightId] = useState(null);
  const [adminFlightForm, setAdminFlightForm] = useState({
    flight_number: "",
    from_city: "",
    to_city: "",
    departure_time: "",
    arrival_time: "",
    price: "",
    seats_total: "",
  });

  useEffect(() => {
    async function loadCities() {
      try {
        const [citiesData, flightsData] = await Promise.all([getCities(), getAllFlights()]);

        const sortedFlights = [...flightsData].sort(
          (a, b) => new Date(a.departure_time) - new Date(b.departure_time)
        );

        setCities(citiesData);
        setAllFlights(sortedFlights);
      } catch (err) {
        setError("Cities could not be loaded.");
      } finally {
        setAllFlightsLoading(false);
      }
    }

    setAllFlightsLoading(true);
    loadCities();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function resetAdminFlightForm() {
    setEditingFlightId(null);
    setAdminFlightForm({
      flight_number: "",
      from_city: "",
      to_city: "",
      departure_time: "",
      arrival_time: "",
      price: "",
      seats_total: "",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const results = await searchFlights(form);
      setFlights(results);
    } catch (err) {
      setError("Flight search failed.");
      setFlights([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadAdminFlights() {
    const flights = await getAllFlights();
    setAdminFlights(flights);
  }

  async function handleAdminLogin(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Login check is made by backend with hashed password validation.
      await adminLogin(adminCredentials);
      setAdminLoggedIn(true);
      await loadAdminFlights();
      setSuccess("Admin login successful.");
    } catch (err) {
      setAdminLoggedIn(false);
      setError(err.message || "Admin login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminRegister(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await adminRegister(adminCredentials);
      setSuccess("Admin account created. You can now login.");
      setAdminAuthMode("login");
    } catch (err) {
      setError(err.message || "Admin register failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleAdminInputChange(event) {
    const { name, value } = event.target;
    setAdminFlightForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleEditFlight(flight) {
    // Datetime-local input expects YYYY-MM-DDTHH:mm format.
    const toDateTimeLocal = (value) => new Date(value).toISOString().slice(0, 16);

    setEditingFlightId(flight._id);
    setAdminFlightForm({
      flight_number: flight.flight_number,
      from_city: flight.from_city?._id || "",
      to_city: flight.to_city?._id || "",
      departure_time: toDateTimeLocal(flight.departure_time),
      arrival_time: toDateTimeLocal(flight.arrival_time),
      price: String(flight.price),
      seats_total: String(flight.seats_total),
    });
    setError("");
    setSuccess("");
  }

  async function handleAdminFlightSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload = {
        ...adminFlightForm,
        price: Number(adminFlightForm.price),
        seats_total: Number(adminFlightForm.seats_total),
        departure_time: new Date(adminFlightForm.departure_time).toISOString(),
        arrival_time: new Date(adminFlightForm.arrival_time).toISOString(),
      };

      if (editingFlightId) {
        await updateFlightAdmin(editingFlightId, payload, adminCredentials);
        setSuccess("Flight updated successfully.");
      } else {
        await createFlightAdmin(payload, adminCredentials);
        setSuccess("Flight created successfully.");
      }

      resetAdminFlightForm();
      await loadAdminFlights();
    } catch (err) {
      setError(err.message || "Operation failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteFlight(id) {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await deleteFlightAdmin(id, adminCredentials);
      setSuccess("Flight deleted successfully.");
      await loadAdminFlights();
    } catch (err) {
      setError(err.message || "Delete failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleStartBooking(flight) {
    setSelectedFlight(flight);
    setBookingForm({
      passenger_name: "",
      passenger_email: "",
      passenger_phone: "",
      seat_count: 1,
    });
    setError("");
    setView("booking");
  }

  function handleBookingChange(event) {
    const { name, value } = event.target;
    setBookingForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleBookingSubmit(event) {
    event.preventDefault();
    if (!selectedFlight) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Ticket request is sent with selected flight and passenger details.
      const result = await createTicket({
        flight_id: selectedFlight._id,
        passenger_name: bookingForm.passenger_name,
        passenger_email: bookingForm.passenger_email,
        passenger_phone: bookingForm.passenger_phone,
        seat_count: Number(bookingForm.seat_count),
      });

      setBookingResult({
        ...result,
        flight: selectedFlight,
      });
      setView("confirmation");
    } catch (err) {
      setError(err.message || "Ticket booking failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleBackToSearch() {
    setView("search");
    setSelectedFlight(null);
    setBookingResult(null);
    setError("");
    setSuccess("");
  }

  function handleGoToUser() {
    setPage("user");
    setError("");
    setSuccess("");
  }

  function handleGoToAdmin() {
    setPage("admin");
    setError("");
    setSuccess("");
  }

  if (page === "admin") {
    return (
      <div className="page">
        <div className="container">
          <div className="top-nav">
            <button type="button" className="btn secondary" onClick={handleGoToUser}>
              User Search
            </button>
            <button type="button" className="btn" onClick={handleGoToAdmin}>
              Admin Panel
            </button>
          </div>

          <h1 className="title">Admin Panel</h1>

          {!adminLoggedIn ? (
            <>
              <div className="auth-switch">
                <button
                  type="button"
                  className={`btn ${adminAuthMode === "login" ? "" : "secondary"}`}
                  onClick={() => setAdminAuthMode("login")}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={`btn ${adminAuthMode === "register" ? "" : "secondary"}`}
                  onClick={() => setAdminAuthMode("register")}
                >
                  Register
                </button>
              </div>

              <form
                className="admin-login-form"
                onSubmit={adminAuthMode === "login" ? handleAdminLogin : handleAdminRegister}
              >
                <div className="field">
                  <label htmlFor="admin_username">Username</label>
                  <input
                    id="admin_username"
                    type="text"
                    value={adminCredentials.username}
                    onChange={(e) => setAdminCredentials((prev) => ({ ...prev, username: e.target.value }))}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="admin_password">Password</label>
                  <input
                    id="admin_password"
                    type="password"
                    value={adminCredentials.password}
                    onChange={(e) => setAdminCredentials((prev) => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
                <button type="submit" className="btn" disabled={loading}>
                  {loading
                    ? adminAuthMode === "login"
                      ? "Logging in..."
                      : "Registering..."
                    : adminAuthMode === "login"
                      ? "Login"
                      : "Create Account"}
                </button>
              </form>
            </>
          ) : (
            <>
              <form className="admin-flight-form" onSubmit={handleAdminFlightSubmit}>
                <div className="field">
                  <label htmlFor="flight_number">Flight Number</label>
                  <input id="flight_number" name="flight_number" value={adminFlightForm.flight_number} onChange={handleAdminInputChange} required />
                </div>
                <div className="field">
                  <label htmlFor="from_city_admin">From City</label>
                  <select id="from_city_admin" name="from_city" value={adminFlightForm.from_city} onChange={handleAdminInputChange} required>
                    <option value="">Select city</option>
                    {cities.map((city) => (
                      <option key={city._id} value={city._id}>{city.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="to_city_admin">To City</label>
                  <select id="to_city_admin" name="to_city" value={adminFlightForm.to_city} onChange={handleAdminInputChange} required>
                    <option value="">Select city</option>
                    {cities.map((city) => (
                      <option key={city._id} value={city._id}>{city.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="departure_time">Departure Time</label>
                  <input id="departure_time" name="departure_time" type="datetime-local" value={adminFlightForm.departure_time} onChange={handleAdminInputChange} required />
                </div>
                <div className="field">
                  <label htmlFor="arrival_time">Arrival Time</label>
                  <input id="arrival_time" name="arrival_time" type="datetime-local" value={adminFlightForm.arrival_time} onChange={handleAdminInputChange} required />
                </div>
                <div className="field">
                  <label htmlFor="price">Price</label>
                  <input id="price" name="price" type="number" min="0" value={adminFlightForm.price} onChange={handleAdminInputChange} required />
                </div>
                <div className="field">
                  <label htmlFor="seats_total">Total Seats</label>
                  <input id="seats_total" name="seats_total" type="number" min="1" value={adminFlightForm.seats_total} onChange={handleAdminInputChange} required />
                </div>
                <div className="actions">
                  <button type="submit" className="btn" disabled={loading}>
                    {loading ? "Saving..." : editingFlightId ? "Update Flight" : "Create Flight"}
                  </button>
                  <button type="button" className="btn secondary" onClick={resetAdminFlightForm}>
                    Clear
                  </button>
                </div>
              </form>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Flight No</th>
                      <th>Route</th>
                      <th>Departure</th>
                      <th>Price</th>
                      <th>Seats</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminFlights.map((flight) => (
                      <tr key={flight._id}>
                        <td>{flight.flight_number}</td>
                        <td>{flight.from_city?.name} → {flight.to_city?.name}</td>
                        <td>{formatDateTime(flight.departure_time)}</td>
                        <td>{flight.price} TL</td>
                        <td>{flight.seats_available}/{flight.seats_total}</td>
                        <td>
                          <button type="button" className="btn small" onClick={() => handleEditFlight(flight)}>Edit</button>
                          <button type="button" className="btn small danger" onClick={() => handleDeleteFlight(flight._id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}
        </div>
      </div>
    );
  }

  if (view === "booking" && selectedFlight) {
    return (
      <div className="page">
        <div className="container">
          <h1 className="title">Reservation Form</h1>

          <div className="flight-card">
            <div className="row">
              <strong>{selectedFlight.from_city?.name}</strong>
              <span>→</span>
              <strong>{selectedFlight.to_city?.name}</strong>
            </div>
            <p>Flight No: {selectedFlight.flight_number}</p>
            <p>Departure: {formatDateTime(selectedFlight.departure_time)}</p>
            <p>Price: {selectedFlight.price} TL</p>
            <p>Available Seats: {selectedFlight.seats_available}</p>
          </div>

          <form className="booking-form" onSubmit={handleBookingSubmit}>
            <div className="field">
              <label htmlFor="passenger_name">Passenger Name</label>
              <input
                id="passenger_name"
                name="passenger_name"
                type="text"
                value={bookingForm.passenger_name}
                onChange={handleBookingChange}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="passenger_email">Passenger Email</label>
              <input
                id="passenger_email"
                name="passenger_email"
                type="email"
                value={bookingForm.passenger_email}
                onChange={handleBookingChange}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="passenger_phone">Passenger Phone</label>
              <input
                id="passenger_phone"
                name="passenger_phone"
                type="text"
                value={bookingForm.passenger_phone}
                onChange={handleBookingChange}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="seat_count">Seat Count</label>
              <input
                id="seat_count"
                name="seat_count"
                type="number"
                min="1"
                value={bookingForm.seat_count}
                onChange={handleBookingChange}
                required
              />
            </div>

            <div className="actions">
              <button type="submit" className="btn" disabled={loading}>
                {loading ? "Booking..." : "Confirm Reservation"}
              </button>
              <button type="button" className="btn secondary" onClick={handleBackToSearch}>
                Cancel
              </button>
            </div>
          </form>

          {error && <p className="error">{error}</p>}
        </div>
      </div>
    );
  }

  if (view === "confirmation" && bookingResult) {
    return (
      <div className="page">
        <div className="container">
          <h1 className="title">Reservation Confirmed</h1>
          <div className="confirmation-card">
            <p><strong>Passenger:</strong> {bookingResult.ticket.passenger_name}</p>
            <p><strong>Email:</strong> {bookingResult.ticket.passenger_email}</p>
            <p><strong>Phone:</strong> {bookingResult.ticket.passenger_phone}</p>
            <p><strong>Flight:</strong> {bookingResult.flight.flight_number}</p>
            <p>
              <strong>Route:</strong> {bookingResult.flight.from_city?.name} → {bookingResult.flight.to_city?.name}
            </p>
            <p><strong>Seat Count:</strong> {bookingResult.ticket.seat_count}</p>
            <p><strong>Total Price:</strong> {bookingResult.ticket.total_price} TL</p>
            <p><strong>Remaining Seats:</strong> {bookingResult.seats_available}</p>
          </div>

          <button type="button" className="btn" onClick={handleBackToSearch}>
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="top-nav">
          <button type="button" className="btn" onClick={handleGoToUser}>
            User Search
          </button>
          <button type="button" className="btn secondary" onClick={handleGoToAdmin}>
            Admin Panel
          </button>
        </div>

        <h1 className="title">FlyTicket Flight Search</h1>

        <form className="search-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="from_city">From City</label>
            <select id="from_city" name="from_city" value={form.from_city} onChange={handleChange} required>
              <option value="">Select city</option>
              {cities.map((city) => (
                <option key={city._id} value={city._id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="to_city">To City</label>
            <select id="to_city" name="to_city" value={form.to_city} onChange={handleChange} required>
              <option value="">Select city</option>
              {cities.map((city) => (
                <option key={city._id} value={city._id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="date">Date</label>
            <input id="date" name="date" type="date" value={form.date} onChange={handleChange} required />
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Searching..." : "Search Flights"}
          </button>
        </form>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        <div className="flight-list">
          {flights.map((flight) => (
            <div key={flight._id} className="flight-card">
              <div className="row">
                <strong>{flight.from_city?.name}</strong>
                <span>→</span>
                <strong>{flight.to_city?.name}</strong>
              </div>
              <p>Flight No: {flight.flight_number}</p>
              <p>Departure: {formatDateTime(flight.departure_time)}</p>
              <p>Arrival: {formatDateTime(flight.arrival_time)}</p>
              <p>Price: {flight.price} TL</p>
              <p>Available Seats: {flight.seats_available}</p>
              <button type="button" className="btn" onClick={() => handleStartBooking(flight)}>
                Book This Flight
              </button>
            </div>
          ))}

          {!loading && flights.length === 0 && <p className="empty">No flights found.</p>}
        </div>

        <div className="all-flights-section">
          <h2 className="sub-title">All Flights (Departure Date: Ascending)</h2>

          {allFlightsLoading && <p className="empty">Loading all flights...</p>}

          {!allFlightsLoading && allFlights.length === 0 && <p className="empty">No flights available.</p>}

          {!allFlightsLoading && allFlights.length > 0 && (
            <div className="flight-list">
              {allFlights.map((flight) => (
                <div key={`all-${flight._id}`} className="flight-card">
                  <div className="row">
                    <strong>{flight.from_city?.name}</strong>
                    <span>→</span>
                    <strong>{flight.to_city?.name}</strong>
                  </div>
                  <p>Flight No: {flight.flight_number}</p>
                  <p>Departure: {formatDateTime(flight.departure_time)}</p>
                  <p>Arrival: {formatDateTime(flight.arrival_time)}</p>
                  <p>Price: {flight.price} TL</p>
                  <p>Available Seats: {flight.seats_available}</p>
                  <button type="button" className="btn" onClick={() => handleStartBooking(flight)}>
                    Book This Flight
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
