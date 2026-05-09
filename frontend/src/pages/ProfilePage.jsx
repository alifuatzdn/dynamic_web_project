import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserTickets, getAllTickets, getAllFlights, createFlightAdmin, updateFlightAdmin, deleteFlightAdmin, getCities } from '../api';
import Header from '../components/Header';
import styles from '../styles/ProfilePage.module.css';

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [flights, setFlights] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [adminFlightPage, setAdminFlightPage] = useState(1);
  const [adminFlightTotalPages, setAdminFlightTotalPages] = useState(1);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    loadData(parsedUser, adminFlightPage);
  }, [navigate]);

  async function loadData(currentUser, pageNum = 1) {
    setLoading(true);
    try {
      if (currentUser.role === 'admin') {
        const [allTix, flightData, allCities] = await Promise.all([
          getAllTickets(),
          getAllFlights(pageNum),
          getCities()
        ]);
        setTickets(allTix);
        setFlights(flightData.data);
        setAdminFlightTotalPages(flightData.totalPages);
        setAdminFlightPage(flightData.page);
        setCities(allCities);
      } else {
        const userTix = await getUserTickets(currentUser.username);
        setTickets(userTix);
      }
    } catch {
      setError('Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('user');
    navigate('/');
  }

  if (!user || loading) return <div><Header /><p>Loading profile...</p></div>;

  return (
    <>
      <Header />
      <div className={styles.profileContainer}>
        <div className={styles.profileHeader}>
          <h2>Welcome, {user.username}!</h2>
          <span className={`${styles.badge} ${styles[user.role]}`}>
            {user.role}
          </span>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {user.role === 'admin' ? (
          <AdminDashboard
            tickets={tickets}
            flights={flights}
            cities={cities}
            credentials={{ username: user.username, password: user.password }}
            reload={(page = adminFlightPage) => loadData(user, page)}
            currentPage={adminFlightPage}
            totalPages={adminFlightTotalPages}
          />
        ) : (
          <UserDashboard tickets={tickets} />
        )}
      </div>
    </>
  );
}

function UserDashboard({ tickets }) {
  return (
    <div className={styles.dashboard}>
      <h3>My Bookings</h3>

      {tickets.length === 0 ? (
        <p>You have no bookings yet.</p>
      ) : (
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Flight No</th>
              <th>From</th>
              <th>To</th>
              <th>Date</th>
              <th>Arrival</th>
              <th>Seats</th>
              <th>Total Price</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(t => (
              <tr key={t.id}>
                <td>{t.flight?.flightNumber || t.flightId}</td>
                <td>{t.flight?.fromCity?.name}</td>
                <td>{t.flight?.toCity?.name}</td>
                <td>{new Date(t.flight?.departureTime).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td>{t.flight?.arrivalTime ? new Date(t.flight.arrivalTime).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</td>
                <td>{t.seatCount}</td>
                <td>{t.totalPrice} TL</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function AdminDashboard({ tickets, flights, cities, credentials, reload, currentPage, totalPages }) {
  const [form, setForm] = useState({ flightNumber: '', fromCityId: '', toCityId: '', departureTime: '', arrivalTime: '', price: '', seatsTotal: '' });
  const [editingId, setEditingId] = useState(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleFlightSubmit(e) {
    e.preventDefault();
    try {
      const payload = {
        flight_number: form.flightNumber,
        from_city: Number(form.fromCityId),
        to_city: Number(form.toCityId),
        departure_time: form.departureTime,
        arrival_time: form.arrivalTime,
        price: Number(form.price),
        seats_total: Number(form.seatsTotal)
      };

      if (editingId) {
        await updateFlightAdmin(editingId, payload, credentials);
      } else {
        await createFlightAdmin(payload, credentials);
      }

      setForm({ flightNumber: '', fromCityId: '', toCityId: '', departureTime: '', arrivalTime: '', price: '', seatsTotal: '' });
      setEditingId(null);
      reload();
    } catch (err) {
      alert("Error saving flight: " + err.message);
    }
  }

  async function handleDeleteFlight(id) {
    if (confirm('Are you sure you want to delete this flight?')) {
      await deleteFlightAdmin(id, credentials);
      reload();
    }
  }

  function handleEditFlight(f) {
    setEditingId(f._id);
    setForm({
      flightNumber: f.flight_number,
      fromCityId: f.from_city._id,
      toCityId: f.to_city._id,
      departureTime: new Date(f.departure_time).toISOString().slice(0, 16),
      arrivalTime: new Date(f.arrival_time).toISOString().slice(0, 16),
      price: f.price,
      seatsTotal: f.seats_total
    });
  }

  return (
    <div className={styles.dashboard}>
      <h3>Admin Dashboard</h3>

      <div className={styles.adminSection}>
        <h4>Manage Flights</h4>

        <form onSubmit={handleFlightSubmit} className={styles.adminForm}>
          <input name="flightNumber" value={form.flightNumber} onChange={handleChange} placeholder="Flight No" />
          <select name="fromCityId" value={form.fromCityId} onChange={handleChange}>
            <option value="">From City</option>
            {cities.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>

          <select name="toCityId" value={form.toCityId} onChange={handleChange}>
            <option value="">To City</option>
            {cities.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>

          <input type="datetime-local" name="departureTime" value={form.departureTime} onChange={handleChange} />
          <input type="datetime-local" name="arrivalTime" value={form.arrivalTime} onChange={handleChange} />
          <input type="number" name="price" placeholder="Price" value={form.price} onChange={handleChange} />
          <input type="number" name="seatsTotal" placeholder="Seat Capacity" value={form.seatsTotal} onChange={handleChange} />

          <button type="submit" className={styles.btnSmall}>
            {editingId ? 'Update Flight' : 'Add Flight'}
          </button>
        </form>

        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Flight No</th>
              <th>From</th>
              <th>To</th>
              <th>Departure</th>
              <th>Arrival</th>
              <th>Price</th>
              <th>Seats</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {flights.map(f => (
              <tr key={f._id}>
                <td>{f.flight_number}</td>
                <td>{f.from_city.name}</td>
                <td>{f.to_city.name}</td>
                <td>{new Date(f.departure_time).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td>{new Date(f.arrival_time).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td>{f.price} TL</td>
                <td>{f.seats_available} / {f.seats_total}</td>
                <td>
                  <button onClick={() => handleEditFlight(f)} className={`${styles.btnSmall} ${styles.edit}`}>
                    Edit
                  </button>

                  <button onClick={() => handleDeleteFlight(f._id)} className={`${styles.btnSmall} ${styles.delete}`}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button disabled={currentPage <= 1} onClick={() => reload(currentPage - 1)}>Prev</button>
            <span>Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage >= totalPages} onClick={() => reload(currentPage + 1)}>Next</button>
          </div>
        )}
      </div>

      <div className={styles.adminSection}>
        <h4>All Ticket Bookings</h4>

        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Passenger</th>
              <th>Flight</th>
              <th>Seats</th>
              <th>Price</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {tickets.map(t => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.passengerName}<br /><small>{t.passengerEmail}</small></td>
                <td>{t.flight?.flightNumber || t.flight?.flight_number}</td>
                <td>{t.seatCount}</td>
                <td>{t.totalPrice} TL</td>
                <td>{t.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProfilePage;