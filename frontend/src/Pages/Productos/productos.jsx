// src/Pages/Productos/productos.jsx
import React, { useState, useEffect } from 'react';
// Importa Link solo si lo usas para enlaces a detalles de producto
// import { Link } from 'react-router-dom';
import ProductCard from '../../components/ProductCard/ProductCart'; // <--- Importar el nuevo componente
import './productos.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

function Productos() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        console.error("Error al obtener los productos:", err);
        setError("No se pudieron cargar los productos. Inténtalo de nuevo más tarde.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleFilterClick = (category) => {
    setSelectedCategory(category);
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(product => product.category === selectedCategory);

  return (
    <section id="productos-section" className="products-page">
      <div className="container">
        <h2 className="products-title-header"> <span className="kawaii-emoji">🌸</span> Nuestros Productos Kawaii <span className="kawaii-emoji">🌸</span></h2>

        <div className="product-filters">
          <button
            className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterClick('all')}
            data-category="all">Todos
          </button>
          <button
            className={`filter-btn ${selectedCategory === 'Ropa' ? 'active' : ''}`}
            onClick={() => handleFilterClick('Ropa')}
            data-category="Ropa">Ropa
          </button>
          <button
            className={`filter-btn ${selectedCategory === 'Accesorios' ? 'active' : ''}`}
            onClick={() => handleFilterClick('Accesorios')}
            data-category="Accesorios">Accesorios
          </button>
          <button
            className={`filter-btn ${selectedCategory === 'Juguetes' ? 'active' : ''}`}
            onClick={() => handleFilterClick('Juguetes')}
            data-category="Juguetes">Juguetes
          </button>
        </div>

        <div className="products-grid">
          {loading && <p className="loading-message">Cargando productos...</p>}
          {error && <p className="error-message">{error}</p>}

          {!loading && !error && filteredProducts.length === 0 && (
            <p className="no-products-message">No hay productos disponibles en esta categoría.</p>
          )}

          {!loading && !error && filteredProducts.length > 0 && (
            filteredProducts.map(product => (
              <ProductCard key={product._id} product={product} /> // <--- Usar el componente ProductCard
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default Productos;