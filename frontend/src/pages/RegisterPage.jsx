import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userRegister } from '../api';
import Header from '../components/Header';
import styles from '../styles/AuthPage.module.css';

function RegisterPage() {
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
      // After register, send them to login so they can enter credentials.
      await userRegister(form);
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <h2>Create an Account</h2>
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
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>
          <p className={styles.link}>Already have an account? <Link to="/login">Login here</Link></p>
        </div>
      </div>
    </>
  );
}

export default RegisterPage;