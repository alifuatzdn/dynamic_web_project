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
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    loadData(parsedUser);
  }, [navigate]);

  async function loadData(currentUser) {
    setLoading(true);
    try {
      if (currentUser.role === 'admin') {
        const [allTix, allFli, allCities] = await Promise.all([
          getAllTickets(),
          getAllFlights(),
          getCities()
        ]);
        setTickets(allTix);
        setFlights(allFli);
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
          <AdminDashboard tickets={tickets} flights={flights} cities={cities} credentials={{ username: user.username, password: 'password' }} reload={() => loadData(user)} />
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
                <td>{new Date(t.flight?.departureTime).toLocaleString('tr-TR')}</td>
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

function AdminDashboard({ tickets, flights, cities, credentials, reload }) {
  const [form, setForm] = useState({ flightNumber: '', fromCityId: '', toCityId: '', departureTime: '', arrivalTime: '', price: '', seatsTotal: '' });
  const [editingId, setEditingId] = useState(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleFlightSubmit(e) {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        fromCityId: Number(form.fromCityId),
        toCityId: Number(form.toCityId),
        price: Number(form.price),
        seatsTotal: Number(form.seatsTotal)
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
    setEditingId(f.id);
    setForm({
      flightNumber: f.flightNumber,
      fromCityId: f.fromCityId,
      toCityId: f.toCityId,
      departureTime: new Date(f.departureTime).toISOString().slice(0, 16),
      arrivalTime: new Date(f.arrivalTime).toISOString().slice(0, 16),
      price: f.price,
      seatsTotal: f.seatsTotal
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
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select name="toCityId" value={form.toCityId} onChange={handleChange}>
            <option value="">To City</option>
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <input type="datetime-local" name="departureTime" value={form.departureTime} onChange={handleChange} />
          <input type="datetime-local" name="arrivalTime" value={form.arrivalTime} onChange={handleChange} />
          <input type="number" name="price" value={form.price} onChange={handleChange} />
          <input type="number" name="seatsTotal" value={form.seatsTotal} onChange={handleChange} />

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
              <th>Seats</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {flights.map(f => (
              <tr key={f.id}>
                <td>{f.flightNumber}</td>
                <td>{cities.find(c => c.id === f.fromCityId)?.name}</td>
                <td>{cities.find(c => c.id === f.toCityId)?.name}</td>
                <td>{new Date(f.departureTime).toLocaleString('tr-TR')}</td>
                <td>{f.seatsAvailable} / {f.seatsTotal}</td>
                <td>
                  <button onClick={() => handleEditFlight(f)} className={`${styles.btnSmall} ${styles.edit}`}>
                    Edit
                  </button>

                  <button onClick={() => handleDeleteFlight(f.id)} className={`${styles.btnSmall} ${styles.delete}`}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
              <th>Total Price</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {tickets.map(t => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.passengerName}<br /><small>{t.passengerEmail}</small></td>
                <td>{t.flight?.flightNumber}</td>
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