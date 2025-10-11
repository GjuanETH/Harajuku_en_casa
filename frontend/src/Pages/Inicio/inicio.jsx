  // src/Pages/Inicio/inicio.jsx
  import { Link } from 'react-router-dom';
  import './inicio.css'; // Asegúrate de que esta línea esté presente

  function Inicio() {
    return (
      <>
        {/* Elementos decorativos (si son solo de esta página, podrían ir aquí,
            pero si son globales, considera moverlos a Layout o a un fondo global) */}
        <div className="kawaii-element" style={{top: '10%', left: '5%'}}>🌸</div>
        <div className="kawaii-element" style={{top: '40%', right: '10%'}}>🍥</div>
        <div className="kawaii-element" style={{bottom: '20%', left: '15%'}}>🎀</div>

        {/* Hero Section */}
        <section id="inicio" className="hero">
          <div className="container"> {/* ESTE DIV CON CLASE .container ES CLAVE PARA CENTRAR */}
            <div className="hero-content">
              <h1>¡Bienvenido al Mundo Kawaii! <span className="kawaii-emoji">🌸</span></h1>
              <p>Descubre los mejores productos harajuku desde la comodidad de tu casa</p>
              <Link to="/productos" className="btn-hero btn-kawaii float-animation">
                <i className="fas fa-star" aria-hidden="true"></i> Explorar Productos
              </Link>
            </div>
            <div className="hero-image">
              <img src="/src/assets/images/hero.jpg" alt="Productos Harajuku Kawaii apilados de forma colorida." />
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="nosotros-section" className="about">
          <div className="container"> {/* ESTE DIV CON CLASE .container ES CLAVE PARA CENTRAR */}
            <h2><span className="kawaii-emoji">🍥</span> Sobre Harajuku en Casa <span className="kawaii-emoji">🍥</span></h2>
            <div className="about-content">
              <div className="about-text">
                <p>Somos una tienda especializada en cultura kawaii y harajuku, trayendo los mejores productos japoneses directamente a tu hogar. Nuestra misión es hacer accesible la moda y estilo de vida kawaii para todos.</p>
                <div className="features">
                  <div className="feature">
                    <h3><i className="fas fa-check-circle" aria-hidden="true"></i> Productos Auténticos</h3>
                    <p>Importamos directamente desde Japón</p>
                  </div>
                  <div className="feature">
                    <h3><i className="fas fa-award" aria-hidden="true"></i> Calidad Garantizada</h3>
                    <p>Todos nuestros productos pasan controles de calidad</p>
                  </div>
                  <div className="feature">
                    <h3><i className="fas fa-shipping-fast" aria-hidden="true"></i> Envío Rápido</h3>
                    <p>Entrega en 2-5 días hábiles</p>
                  </div>
                </div>
              </div>
              <div className="about-image">
                <img src="/src/assets/images/about.jpg" alt="Fachada de una tienda colorida en el barrio Harajuku de Tokio." />
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  export default Inicio;