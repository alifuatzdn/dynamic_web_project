import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFlightById, createTicket } from '../api';
import Header from '../components/Header';
import styles from '../styles/FlightDetailPage.module.css';

function FlightDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [booking, setBooking] = useState(false);

  const [form, setForm] = useState({
    passenger_name: '',
    passenger_email: '',
    passenger_phone: '',
    seat_count: 1
  });

  useEffect(() => {
    // Load flight detail for the page route id.
    getFlightById(id)
      .then(setFlight)
      .catch(() => setError('Failed to load flight details.'))
      .finally(() => setLoading(false));
  }, [id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleBookTicket(e) {
    e.preventDefault();
    setFormError('');
    setBooking(true);

    try {
      // Send booking request then jump to confirmation page.
      const result = await createTicket({
        flight_id: id,
        ...form,
        seat_count: Number(form.seat_count)
      });
      // Route to confirmation
      navigate('/confirmation', { state: { ticket: result.ticket, flight } });
    } catch (err) {
      setFormError(err.message || 'Failed to book ticket.');
    } finally {
      setBooking(false);
    }
  }

  if (loading) return <div><Header /><p>Loading flight...</p></div>;
  if (error || !flight) return <div><Header /><p className={styles.error}>{error || 'Flight not found'}</p></div>;

  return (
    <>
      <Header />
      <div className={styles.detailContainer}>
        <div className={styles.flightInfo}>
          <h2 style={{ marginBottom: 30 }}>Flight Details: {flight.fromCity.name} to {flight.toCity.name}</h2>
          <p><strong>Flight No:</strong> {flight.flightNumber}</p>
          <p><strong>Departure:</strong> {new Date(flight.departureTime).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</p>
          <p><strong>Arrival:</strong> {new Date(flight.arrivalTime).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</p>
          <p><strong>Price per seat:</strong> {flight.price} TL</p>
          <p><strong>Available Seats:</strong> {flight.seatsAvailable}</p>
        </div>

        <div className={styles.formBox}>
          <h3>Book your Ticket</h3>
          {formError && <p className={styles.error}>{formError}</p>}
          <form className={styles.bookingForm} onSubmit={handleBookTicket}>
            <div className={styles.field}>
              <label>Full Name</label>
              <input type="text" name="passenger_name" value={form.passenger_name} onChange={handleChange} required />
            </div>

            <div className={styles.field}>
              <label>Email</label>
              <input type="email" name="passenger_email" value={form.passenger_email} onChange={handleChange} required />
            </div>

            <div className={styles.field}>
              <label>Phone Number</label>
              <input type="tel" name="passenger_phone" value={form.passenger_phone} onChange={handleChange} required />
            </div>

            <div className={styles.field}>
              <label>Number of Seats</label>
              <input type="number" min="1" max={flight.seats_available} name="seat_count" value={form.seat_count} onChange={handleChange} required />
            </div>

            <button className={styles.bookButton} type="submit" disabled={booking || flight.seats_available < 1}>
              {booking ? 'Booking...' : (flight.seats_available < 1 ? 'Sold Out' : 'Confirm Booking')}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default FlightDetailPage;