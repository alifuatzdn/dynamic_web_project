import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCities, searchFlights } from '../api';
import styles from '../styles/MainPage.module.css'
import Header from '../components/Header';
import { FaArrowRight } from 'react-icons/fa';

function MainPage() {
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState({ from_city: '', to_city: '', date: '' });
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchedForm, setSearchedForm] = useState(null);

  useEffect(() => {
    getCities().then(setCities).catch(() => setError('Failed to load cities'));
    performSearch({ from_city: '', to_city: '', date: '' }, 1);
    // eslint-disable-next-line
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function performSearch(searchQuery, pageNum) {
    setError('');
    setLoading(true);
    try {
      const results = await searchFlights({ ...searchQuery, page: pageNum });
      setFlights(results.data);
      setTotalPages(results.totalPages);
      setPage(results.page);
      setSearchedForm(searchQuery);
    } catch (err) {
      setError('Flight search failed.');
      setFlights([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    performSearch(form, 1);
  }

  function handlePageChange(newPage) {
    if (searchedForm) {
      performSearch(searchedForm, newPage);
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
            <select id="from_city" name="from_city" value={form.from_city} onChange={handleChange}>
              <option value="">Any origin</option>
              {cities.map((city) => (
                <option key={city._id} value={city._id}>{city.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="to_city">To City</label>
            <select id="to_city" name="to_city" value={form.to_city} onChange={handleChange}>
              <option value="">Any destination</option>
              {cities.map((city) => (
                <option key={city._id} value={city._id}>{city.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="date">Date</label>
            <input id="date" name="date" type="date" value={form.date} onChange={handleChange} />
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
          <div key={flight._id} className={styles.flightCard}>
            <div className={styles.cardHeader}>
              <strong className={styles.cityLeft}>{flight.from_city?.name}</strong>
              <div className={styles.arrow}>
                <FaArrowRight />
              </div>
              <strong className={styles.cityRight}>{flight.to_city?.name}</strong>
            </div>
            <div className={styles.cardDetails}>
              <p><strong>Flight:</strong> {flight.flight_number}</p>
              <p><strong>Departure:</strong> {new Date(flight.departure_time).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</p>
              <p><strong>Arrival:</strong> {new Date(flight.arrival_time).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</p>
              <p><strong>Seats Available:</strong> {flight.seats_available}</p>
              <div className={styles.cardBottom}>
                <p><strong>Price: </strong> <span className={styles.price}>{flight.price} TL</span></p>
                <Link to={`/flight/${flight._id}`} className={styles.bookBtn}>
                  Select &amp; Book
                </Link>
              </div>
            </div>
          </div>
        ))}
        {!loading && flights.length === 0 && <p className={styles.empty}>Search for a flight to see results here.</p>}        {flights.length > 0 && totalPages > 1 && (
          <div className={styles.pagination}>
            <button disabled={page <= 1} onClick={() => handlePageChange(page - 1)}>Prev</button>
            <span>Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => handlePageChange(page + 1)}>Next</button>
          </div>
        )}      </section >
    </>
  );
}

export default MainPage;