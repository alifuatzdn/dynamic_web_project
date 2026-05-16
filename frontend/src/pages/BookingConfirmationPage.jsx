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
        <p style={{ marginBottom: 10 }}>Thank you, {ticket.passengerName}. Your ticket has been booked successfully.</p>

        <div className={styles.ticketSummary}>
          <p><strong>Username:</strong> {ticket.user?.username || '-'} </p>
          <p><strong>Passenger Name:</strong> {ticket.passengerName}</p>
          <p><strong>Route:</strong> {flight.fromCity.name} &#8594; {flight.toCity.name}</p>
          <p><strong>Flight No:</strong> {flight.flightNumber}</p>
          <p><strong>Departure:</strong> {new Date(flight.departureTime).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</p>
          <p><strong>Passengers / Seats:</strong> {ticket.seatCount}</p>
          <p><strong>Email given:</strong> {ticket.passengerEmail}</p>

          <p className={styles.totalPrice}>Total Paid: {ticket.totalPrice} TL</p>
        </div>

        <Link to="/profile" className={styles.btn}>View My Bookings</Link>
      </div>
    </>
  );
}

export default BookingConfirmationPage;