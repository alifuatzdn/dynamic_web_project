import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCities, searchFlights } from '../api';
import styles from '../styles/MainPage.module.css'
import Header from '../components/Header';

function MainPage() {
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState({ from_city: '', to_city: '', date: '' });
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getCities().then(setCities).catch(() => setError('Failed to load cities'));
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const results = await searchFlights(form);
      setFlights(results);
    } catch (err) {
      setError('Flight search failed.');
      setFlights([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <section className={styles.hero}>
        <h2>Discover Your Next Destination</h2>
        <p>Search and book flights easily and securely.</p>

        <form className={styles.searchForm} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="from_city">From City</label>
            <select id="from_city" name="from_city" value={form.from_city} onChange={handleChange} required>
              <option value="">Select origin</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="to_city">To City</label>
            <select id="to_city" name="to_city" value={form.to_city} onChange={handleChange} required>
              <option value="">Select destination</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="date">Date</label>
            <input id="date" name="date" type="date" value={form.date} onChange={handleChange} required />
          </div>
          <div className={styles.searchButton}>
            <button type="submit" disabled={loading}>
              {loading ? 'Searching...' : 'Search Flights'}
            </button>
          </div>
        </form>
        {error && <p className={styles.error}>{error}</p>}
      </section >

      <section className={styles.flightResults}>
        {flights.map((flight) => (
          <div key={flight.id} className={styles.flightCard}>
            <div className={styles.cardHeader}>
              <strong>{flight.fromCity?.name}</strong>
              <span className={styles.arrow}>&#8594;</span>
              <strong>{flight.toCity?.name}</strong>
            </div>
            <div className={styles.cardDetails}>
              <p>Flight: {flight.flightNumber}</p>
              <p>Departure: {new Date(flight.departureTime).toLocaleString('tr-TR')}</p>
              <p>Arrival: {new Date(flight.arrivalTime).toLocaleString('tr-TR')}</p>
              <p className={styles.price}>{flight.price} TL</p>
              <p>Seats Available: {flight.seatsAvailable}</p>
            </div>
          </div>
        ))}
        {!loading && flights.length === 0 && <p className={styles.empty}>Search for a flight to see results here.</p>}
      </section>
    </>
  );
}

export default MainPage;