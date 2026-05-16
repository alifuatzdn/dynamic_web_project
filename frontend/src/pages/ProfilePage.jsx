import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserTickets, getAllTickets, getAllFlights, createFlightAdmin, updateFlightAdmin, deleteFlightAdmin, getCities } from '../api';
import Header from '../components/Header';
import styles from '../styles/ProfilePage.module.css';

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    setAuthChecked(true);
  }, [navigate]);

  if (!authChecked || !user) {
    return (
      <div>
        <Header />
        <p>Loading profile...</p>
      </div>
    );
  }

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

        {user.role === 'admin' ? (
          <AdminDashboard user={user} />
        ) : (
          <UserDashboard user={user} />
        )}
      </div>
    </>
  );
}

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

const UserDashboard = React.memo(function UserDashboard({ user }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;
    async function loadTickets() {
      setLoading(true);
      setError('');
      try {
        const userTix = await getUserTickets(user.username);
        if (isActive) setTickets(userTix);
      } catch (err) {
        if (isActive) setError(err.message || 'Failed to load tickets.');
      } finally {
        if (isActive) setLoading(false);
      }
    }

    loadTickets();
    return () => {
      isActive = false;
    };
  }, [user.username]);

  return (
    <div className={styles.dashboard}>
      <h3>My Bookings</h3>

      {loading && <p>Loading bookings...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && tickets.length === 0 ? (
        <p>You have no bookings yet.</p>
      ) : (
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Username</th>
              <th>Passenger Name</th>
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
                <td>{t.user?.username || user.username}</td>
                <td>{t.passengerName}</td>
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
});

const AdminDashboard = React.memo(function AdminDashboard({ user }) {
  const credentials = { username: user.username, password: user.password };
  const [tickets, setTickets] = useState([]);
  const [flights, setFlights] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingFlights, setLoadingFlights] = useState(true);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [error, setError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  const [createForm, setCreateForm] = useState({ flightNumber: '', fromCityId: '', toCityId: '', departureTime: '', arrivalTime: '', price: '', seatsTotal: '' });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ flightNumber: '', fromCityId: '', toCityId: '', departureTime: '', arrivalTime: '', price: '', seatsTotal: '' });

  useEffect(() => {
    let isActive = true;
    async function loadMeta() {
      setLoadingMeta(true);
      setError('');
      try {
        const [allTix, allCities] = await Promise.all([
          getAllTickets(),
          getCities()
        ]);
        if (isActive) {
          setTickets(allTix);
          setCities(allCities);
        }
      } catch (err) {
        if (isActive) setError(err.message || 'Failed to load admin data.');
      } finally {
        if (isActive) setLoadingMeta(false);
      }
    }

    loadMeta();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    async function loadFlights() {
      setLoadingFlights(true);
      setError('');
      try {
        const flightData = await getAllFlights(currentPage, debouncedSearch);
        if (isActive) {
          setFlights(flightData.data);
          setTotalPages(flightData.totalPages);
          setCurrentPage(flightData.page);
        }
      } catch (err) {
        if (isActive) setError(err.message || 'Failed to load flights.');
      } finally {
        if (isActive) setLoadingFlights(false);
      }
    }

    loadFlights();
    return () => {
      isActive = false;
    };
  }, [currentPage, debouncedSearch, refreshKey]);

  const handleCreateChange = useCallback((e) => {
    const { name, value } = e.target;
    setCreateForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleEditChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  }, []);

  async function handleCreateSubmit(e) {
    e.preventDefault();
    try {
      const payload = {
        flight_number: createForm.flightNumber,
        from_city: createForm.fromCityId, // Removed Number() to keep ObjectId as string
        to_city: createForm.toCityId,     // Removed Number() to keep ObjectId as string
        departure_time: createForm.departureTime,
        arrival_time: createForm.arrivalTime,
        price: Number(createForm.price),
        seats_total: Number(createForm.seatsTotal)
      };

      await createFlightAdmin(payload, credentials);

      setCreateForm({ flightNumber: '', fromCityId: '', toCityId: '', departureTime: '', arrivalTime: '', price: '', seatsTotal: '' });
      setRefreshKey(key => key + 1);
    } catch (err) {
      alert("Error saving flight: " + err.message);
    }
  }

  async function handleUpdateSubmit(e) {
    e.preventDefault();
    try {
      const payload = {
        flight_number: editForm.flightNumber,
        from_city: editForm.fromCityId,
        to_city: editForm.toCityId,
        departure_time: editForm.departureTime,
        arrival_time: editForm.arrivalTime,
        price: Number(editForm.price),
        seats_total: Number(editForm.seatsTotal)
      };

      await updateFlightAdmin(editingId, payload, credentials);

      setEditingId(null);
      setRefreshKey(key => key + 1);
    } catch (err) {
      alert("Error updating flight: " + err.message);
    }
  }

  async function handleDeleteFlight(id) {
    if (confirm('Are you sure you want to delete this flight?')) {
      try {
        await deleteFlightAdmin(id, credentials);
        setRefreshKey(key => key + 1);
      } catch (err) {
        alert("Error deleting flight: " + err.message);
      }
    }
  }

  function toLocalDatetime(dateString) {
    const d = new Date(dateString);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  function startEditing(f) {
    setEditingId(f.id);
    setEditForm({
      flightNumber: f.flightNumber,
      fromCityId: f.fromCity.id || f.fromCity._id, // Ensure we get the ID correctly
      toCityId: f.toCity.id || f.toCity._id,
      departureTime: toLocalDatetime(f.departureTime),
      arrivalTime: toLocalDatetime(f.arrivalTime),
      price: f.price,
      seatsTotal: f.seatsTotal
    });
  }

  function cancelEditing() {
    setEditingId(null);
  }

  return (
    <div className={styles.dashboard}>
      <h3>Admin Dashboard</h3>

      <div className={styles.adminSection}>
        <h4>Add New Flight</h4>

        <form onSubmit={handleCreateSubmit} className={styles.adminForm}>
          <input name="flightNumber" value={createForm.flightNumber} onChange={handleCreateChange} placeholder="Flight No" required />
          <select name="fromCityId" value={createForm.fromCityId} onChange={handleCreateChange} required>
            <option value="">From City</option>
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select name="toCityId" value={createForm.toCityId} onChange={handleCreateChange} required>
            <option value="">To City</option>
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <input type="datetime-local" name="departureTime" value={createForm.departureTime} onChange={handleCreateChange} required />
          <input type="datetime-local" name="arrivalTime" value={createForm.arrivalTime} onChange={handleCreateChange} required />
          <input type="number" name="price" placeholder="Price" value={createForm.price} onChange={handleCreateChange} required min="0" />
          <input type="number" name="seatsTotal" placeholder="Seat Capacity" value={createForm.seatsTotal} onChange={handleCreateChange} required min="1" />

          <button type="submit" className={styles.btnSmall}>
            Add Flight
          </button>
        </form>

        <br />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h4 style={{ margin: 0 }}>Manage Flights</h4>
          <input
            type="text"
            placeholder="Search by flight number or ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', minWidth: '250px' }}
          />
        </div>

        {loadingMeta && <p>Loading admin data...</p>}
        {error && <p className={styles.error}>{error}</p>}

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
              editingId === f.id ? (
                <tr key={`edit-${f.id}`} className={styles.inputs}>
                  <td><input name="flightNumber" value={editForm.flightNumber} onChange={handleEditChange} required style={{ width: '80px' }} /></td>
                  <td>
                    <select name="fromCityId" value={editForm.fromCityId} onChange={handleEditChange} required style={{ width: '100px', height: "40px", padding: "5px", borderRadius: "5px", border: "1px solid #ccc" }}>
                      <option value="">From City</option>
                      {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </td>
                  <td>
                    <select name="toCityId" value={editForm.toCityId} onChange={handleEditChange} required style={{ width: '100px', height: "40px", padding: "5px", borderRadius: "5px", border: "1px solid #ccc" }}>
                      <option value="">To City</option>
                      {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </td>
                  <td><input type="datetime-local" name="departureTime" value={editForm.departureTime} onChange={handleEditChange} required /></td>
                  <td><input type="datetime-local" name="arrivalTime" value={editForm.arrivalTime} onChange={handleEditChange} required /></td>
                  <td><input type="number" name="price" value={editForm.price} onChange={handleEditChange} required min="0" style={{ width: '70px' }} /></td>
                  <td><input type="number" name="seatsTotal" value={editForm.seatsTotal} onChange={handleEditChange} required min="1" style={{ width: '70px' }} /></td>
                  <td className={styles.editButtons}>
                    <button onClick={handleUpdateSubmit} className={`${styles.btnSmall} ${styles.edit}`}>Save</button>
                    <button onClick={cancelEditing} className={`${styles.btnSmall} ${styles.delete}`}>Cancel</button>
                  </td>
                </tr>
              ) : (
                <tr key={f.id}>
                  <td>{f.flightNumber}</td>
                  <td>{f.fromCity.name}</td>
                  <td>{f.toCity.name}</td>
                  <td>{new Date(f.departureTime).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td>{new Date(f.arrivalTime).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td>{f.price} TL</td>
                  <td>{f.seatsAvailable} / {f.seatsTotal}</td>
                  <td className={styles.editButtons}>
                    <button onClick={() => startEditing(f)} className={`${styles.btnSmall} ${styles.edit}`}>
                      Edit
                    </button>

                    <button onClick={() => handleDeleteFlight(f.id)} className={`${styles.btnSmall} ${styles.delete}`}>
                      Delete
                    </button>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button disabled={currentPage <= 1 || loadingFlights} onClick={() => setCurrentPage(currentPage - 1)}>Prev</button>
            <span>Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage >= totalPages || loadingFlights} onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
          </div>
        )}
      </div>

      <div className={styles.adminSection}>
        <h4>All Ticket Bookings</h4>

        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Passenger Name</th>
              <th>Passenger Email</th>
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
                <td>{t.user?.username || '-'}</td>
                <td>{t.passengerName}</td>
                <td>{t.passengerEmail}</td>
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
});

export default ProfilePage;