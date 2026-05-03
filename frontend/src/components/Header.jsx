import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from '../styles/MainPage.module.css';
import { FaUserCircle } from "react-icons/fa";

function Header() {
  const [user, setUser] = useState(() => {
    const userStr = localStorage.getItem('user');
    if (userStr && userStr !== "undefined") {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userStr = localStorage.getItem('user');

    if (userStr && userStr !== "undefined") {
      try {
        const parsed = JSON.parse(userStr);
        setUser(parsed);
      } catch (e) {
        console.error("User parse error", e);
        localStorage.removeItem('user');
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [location.pathname]);

  const handleLogout = () => {
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