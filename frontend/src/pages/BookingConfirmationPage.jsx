import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import Header from '../components/Header';
import styles from '../styles/BookingConfirmationPage.module.css';

function BookingConfirmationPage() {
  const location = useLocation();
  const state = location.state;

  if (!state || !state.ticket || !state.flight) {
    return (
      <>
        <Header />
        <div className={styles.confirmationContainer}>
          <h2>No booking details found!</h2>
          <Link to="/" className={styles.btn}>Return Home</Link>
        </div>
      </>
    );
  }

  const { ticket, flight } = state;

  return (
    <>
      <Header />
      <div className={styles.confirmationContainer}>
        <h2>Booking Confirmed!</h2>
        <p style={{marginBottom: 10}}>Thank you, {ticket.passenger_name}. Your ticket has been booked successfully.</p>

        <div className={styles.ticketSummary}>
          <p><strong>Route:</strong> {flight.from_city.name} &#8594; {flight.to_city.name}</p>
          <p><strong>Flight No:</strong> {flight.flight_number}</p>
          <p><strong>Departure:</strong> {new Date(flight.departure_time).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</p>
          <p><strong>Passengers / Seats:</strong> {ticket.seat_count}</p>
          <p><strong>Email given:</strong> {ticket.passenger_email}</p>

          <p className={styles.totalPrice}>Total Paid: {ticket.total_price} TL</p>
        </div>

        <Link to="/profile" className={styles.btn}>View My Bookings</Link>
      </div>
    </>
  );
}

export default BookingConfirmationPage;