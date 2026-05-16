import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userLogin } from '../api';
import Header from '../components/Header';
import styles from '../styles/AuthPage.module.css';

function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Store password too since headers auth needs it later.
      const data = await userLogin(form);
      const userToStore = { ...data.user, password: form.password };
      localStorage.setItem('user', JSON.stringify(userToStore));
      navigate('/profile');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <h2>Login to FlyTicket</h2>
          <form onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="username">Username</label>
              <input type="text" id="username" name="username" value={form.username} onChange={handleChange} required />
            </div>
            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <input type="password" id="password" name="password" value={form.password} onChange={handleChange} required />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" disabled={loading} className={styles.authButton}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <p className={styles.link}>Don't have an account? <Link to="/register">Register here</Link></p>
        </div>
      </div>
    </>
  );
}

export default LoginPage;