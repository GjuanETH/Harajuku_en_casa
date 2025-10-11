// src/Pages/Auth/Register.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../components/Notifications/NotificationSystem';
import '../../assets/css/styles.css'; // Tu CSS global
import '../../assets/css/pages/auth.css'; // Estilos específicos de auth

function Register() {
  const [fullName, setFullName] = useState(''); // Nuevo campo
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');     // Nuevo campo
  const [address, setAddress] = useState(''); // Nuevo campo
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showNotification } = useNotification();

  useEffect(() => {
    if (password && confirmPassword) {
      setPasswordMatch(password === confirmPassword);
    } else {
      setPasswordMatch(true);
    }
  }, [password, confirmPassword]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      showNotification('Las contraseñas no coinciden.', 'error');
      setPasswordMatch(false);
      setIsLoading(false);
      return;
    }

    // Aquí, en lugar de solo email y password, pasaremos todos los datos
    try {
      // Nota: Tu backend deberá estar preparado para recibir estos nuevos campos
      const result = await register({ fullName, email, phone, address, password }); // Pasar un objeto con todos los datos
      setIsLoading(false);

      if (result.success) {
        navigate('/');
      }
    } catch (error) {
      setIsLoading(false);
      showNotification(error.message || "Error al intentar registrarse.", "error");
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-container register-form">
        <h2><i className="fas fa-user-plus"></i> Crear una cuenta</h2>
        <form onSubmit={handleSubmit}>
          {/* Campo: Nombre completo */}
          <div className="input-with-icon">
            <i className="fas fa-user"></i>
            <input
              type="text"
              id="fullName"
              placeholder="Nombre completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          {/* Campo: Correo electrónico */}
          <div className="input-with-icon">
            <i className="fas fa-envelope"></i>
            <input
              type="email"
              id="registerEmail"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {/* Campo: Teléfono */}
          <div className="input-with-icon">
            <i className="fas fa-phone"></i>
            <input
              type="tel" // Tipo "tel" para teléfonos
              id="phone"
              placeholder="Teléfono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Campo: Dirección */}
          <div className="input-with-icon">
            <i className="fas fa-home"></i>
            <input
              type="text"
              id="address"
              placeholder="Dirección"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          {/* Campo: Contraseña */}
          <div className="input-with-icon">
            <i className="fas fa-key"></i>
            <input
              type="password"
              id="registerPassword"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          {/* Campo: Confirmar Contraseña */}
          <div className="input-with-icon">
            <i className="fas fa-check-circle"></i>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <button type="submit" className="btn-primary btn-kawaii" disabled={!passwordMatch || isLoading}>
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Registrando...
              </>
            ) : (
              <>
                <i className="fas fa-user-plus"></i> Registrarse
              </>
            )}
          </button>
        </form>
        <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link></p>
      </div>
    </div>
  );
}

export default Register;