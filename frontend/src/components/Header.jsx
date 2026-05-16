import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from '../styles/MainPage.module.css';
import { FaUserCircle } from "react-icons/fa";

function readStoredUser({ removeOnError = false } = {}) {
  const userStr = localStorage.getItem('user');
  if (!userStr || userStr === "undefined") {
    return null;
  }

  try {
    return JSON.parse(userStr);
  } catch (e) {
    if (removeOnError) {
      localStorage.removeItem('user');
    }
    return null;
  }
}

function Header() {
  const [user, setUser] = useState(() => {
    // Pull user once on first render so the header is not blank.
    return readStoredUser();
  });

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Re-check user on route changes so header stays in sync.
    const parsed = readStoredUser({ removeOnError: true });
    if (!parsed) {
      setUser(null);
      return;
    }
    setUser(parsed);
  }, [location.pathname]);

  const handleLogout = () => {
    // Clear localStorage and bounce to home.
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  return (
    <header className={styles.mainHeader}>
      <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        <h1>FlyTicket</h1>
      </Link>
      <div>
        {user ? (
          <div className={styles.profile}>
            <Link to="/profile" className={styles.personIcon} >
              <FaUserCircle size={35} />
            </Link>
            <button onClick={handleLogout} className={styles.authButton}>Logout</button>
          </div>
        ) : (
          <div className={styles.profile}>
            <Link to="/login" className={styles.authButton}>Login</Link>
            <Link to="/register" className={styles.authButton}>Register</Link>
          </div>
        )}
      </div>
    </header >
  );
}

export default Header;