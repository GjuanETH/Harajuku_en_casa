// src/components/Header/Header.jsx
import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import '../../assets/css/header.css'; // Asegúrate de que esta ruta sea correcta

function Header() {
  const { isLoggedIn, userEmail, isAdmin, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getCartCountClass = () => {
    if (totalItems >= 100) {
      return 'triple-digit';
    } else if (totalItems >= 10) {
      return 'double-digit';
    }
    return '';
  };

  return (
    <header className="header">
      <div className="container">
        <div className="logo">
          <img src="/src/assets/images/logo.png" alt="Logo Harajuku en Casa" className="logo-img" />
          <h1 className="site-title">Harajuku en Casa</h1>
        </div>
        <nav className="nav">
          <ul>
            <li><NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>Inicio</NavLink></li>
            <li><NavLink to="/productos" className={({ isActive }) => isActive ? 'active' : ''}>Productos</NavLink></li>
            <li><a href="/#nosotros-section" className="nav-link">Nosotros</a></li>
            <li><a href="/#contacto-section" className="nav-link">Contacto</a></li>
          </ul>
        </nav>
        <div className="user-actions">
          {isLoggedIn ? (
            <div className="auth-buttons">
              <span className="user-email-display">
                Hola, {userEmail ? userEmail.split('@')[0] : 'Usuario'}
              </span>
              {!isAdmin && (
                <Link to="/perfil" className="btn-icon"> {/* Usamos btn-icon */}
                  <i className="fas fa-user" aria-hidden="true"></i>
                </Link>
              )}
              <button onClick={handleLogout} className="btn-icon"> {/* Usamos btn-icon */}
                <i className="fas fa-sign-out-alt" aria-hidden="true"></i>
              </button>
              {isAdmin && (
                <Link to="/admin" className="btn-icon"> {/* Usamos btn-icon */}
                  <i className="fas fa-tachometer-alt" aria-hidden="true"></i>
                </Link>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              {/* Cambiado a btn-login-register para ser más específico */}
              <Link to="/login" className="btn-login-register">
                <i className="fas fa-sign-in-alt" aria-hidden="true"></i> Iniciar Sesión
              </Link>
              <Link to="/registro" className="btn-login-register">
                Registrarse
              </Link>
            </div>
          )}
          <Link to="/carrito" className="btn-cart">
            <i className="fas fa-shopping-cart" aria-hidden="true"></i>
            {totalItems > 0 && (
              <span id="cartCount" className={getCartCountClass()}>
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;