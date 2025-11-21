// src/Pages/Auth/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../assets/css/styles.css';
import '../../assets/css/pages/auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(''); // Estado local para errores inmediatos
  const navigate = useNavigate();
  
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMsg(''); // Limpiar errores previos

    try {
      // La función login del contexto debe manejar la petición a la API
      const result = await login(email, password);
      
      if (result.success) {
        navigate('/');
      } else {
        // Si el login devuelve false/error, mostramos el mensaje
        setErrorMsg(result.message || 'Credenciales incorrectas.');
      }
    } catch (error) {
      console.error("Error en Login:", error);
      setErrorMsg('Error de conexión con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Elementos decorativos kawaii */}
      <div className="kawaii-element flower-top-left">🌸</div>
      <div className="kawaii-element ribbon-bottom-right">🎀</div>

      <div className="auth-container">
        <h2><i className="fas fa-lock"></i> Iniciar Sesión</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="input-with-icon">
            <i className="fas fa-envelope"></i>
            <input
              type="email"
              id="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="input-with-icon">
            <i className="fas fa-key"></i>
            <input
              type="password"
              id="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {/* Mensaje de error visible */}
          {errorMsg && (
            <div className="error-message" style={{ color: 'var(--danger-red)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
              <i className="fas fa-exclamation-circle"></i> {errorMsg}
            </div>
          )}

          <button type="submit" className="btn-primary btn-kawaii" disabled={isLoading}>
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Cargando...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt"></i> Ingresar
              </>
            )}
          </button>
        </form>
        
        <p>¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link></p>
      </div>
    </div>
  );
}

export default Login;