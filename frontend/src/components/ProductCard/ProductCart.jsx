// src/components/ProductCard/ProductCard.jsx
import React, { useState } from 'react'; // <--- Importar useState
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../components/Notifications/NotificationSystem';
import './ProductCart.css';

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { showNotification } = useNotification();
  // Estado para controlar si el producto es favorito (por ahora local y temporal)
  const [isFavorite, setIsFavorite] = useState(false); // <--- Nuevo estado

  const handleAddToCartClick = (e) => {
    e.stopPropagation();
    addToCart(product);
    showNotification(`${product.name} añadido al carrito.`, 'success');
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite); // <--- Alternar el estado isFavorite

    if (!isFavorite) {
      showNotification(`¡${product.name} añadido a tus favoritos! ❤️`, 'info');
      // console.log(`Producto ${product.name} marcado como favorito (Lógica pendiente)`);
    } else {
      showNotification(`${product.name} eliminado de tus favoritos. 💔`, 'info');
      // console.log(`Producto ${product.name} desmarcado como favorito (Lógica pendiente)`);
    }
  };

  const formatNumber = (num) => {
    if (typeof num !== 'number' || isNaN(num)) return '$0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="product-card">
      <Link to={`/productos/${product._id}`} className="product-image-link">
        <img src={product.imageUrl || '/src/assets/images/placeholder.png'} alt={product.name} className="product-image" />
      </Link>
      
      <div className="product-info">
        {product.category && <span className="product-category">{product.category}</span>}
        
        <Link to={`/productos/${product._id}`} className="product-card-title-link">
          <h3 className="product-card-title">{product.name}</h3>
        </Link>
        
        <p className="product-card-description">{product.description}</p>
        
        <p className="product-card-price">{formatNumber(product.price)}</p>
        
        <div className="product-actions">
          <button className="btn-add-cart" onClick={handleAddToCartClick}>
            <i className="fas fa-shopping-cart" aria-hidden="true"></i> Agregar
          </button>
          {/* Añadimos la clase 'is-favorite' condicionalmente */}
          <button className={`btn-favorite ${isFavorite ? 'is-favorite' : ''}`} onClick={handleFavoriteClick}>
            <i className="fas fa-heart" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;