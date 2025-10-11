// src/components/Footer/Footer.jsx
import { Link } from 'react-router-dom';
import '../../components/Footer/footer.css'; // Asegúrate de que esta línea esté presente

function Footer() {
  return (
    <footer className="footer" id="contacto-section">
      <div className="container">
        {/* Este div 'footer-content' agrupará las 3 secciones principales */}
        <div className="footer-content">
          <div className="footer-section">
            <h3>Harajuku en Casa</h3>
            <p>Tu tienda kawaii de confianza</p>
            <div className="social-icons">
              <a href="#" aria-label="Visítanos en Instagram">
                <i className="fab fa-instagram" aria-hidden="true"></i>
              </a>
              <a href="#" aria-label="Visítanos en Facebook">
                <i className="fab fa-facebook" aria-hidden="true"></i>
              </a>
              <a href="#" aria-label="Visítanos en TikTok">
                <i className="fab fa-tiktok" aria-hidden="true"></i>
              </a>
            </div>
          </div>
          <div className="footer-section">
            <h3>Enlaces Rápidos</h3>
            <ul>
              <li>
                <Link to="/productos">
                  <i className="fas fa-arrow-right" aria-hidden="true"></i> Productos
                </Link>
              </li>
              <li>
                <a href="/#nosotros-section">
                  <i className="fas fa-arrow-right" aria-hidden="true"></i> Nosotros
                </a>
              </li>
              <li>
                <a href="/#contacto-section">
                  <i className="fas fa-arrow-right" aria-hidden="true"></i> Contacto
                </a>
              </li>
            </ul>
          </div>
          {/* Mover la sección de Contacto para que esté en el mismo nivel que las otras dos */}
          <div className="footer-section contact-info-section"> {/* Añadí una clase extra para estilos específicos si es necesario */}
            <h3>Contacto</h3>
            <p><i className="fas fa-envelope" aria-hidden="true"></i> info@harajukuencasa.com</p>
            <p><i className="fas fa-phone" aria-hidden="true"></i> +1 234 567 8900</p>
          </div>
        </div>

        {/* El div footer-bottom (copyright) AHORA VA FUERA de footer-content, pero dentro de container */}
        <div className="footer-bottom">
          <p>&copy; 2025 Harajuku en Casa. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;