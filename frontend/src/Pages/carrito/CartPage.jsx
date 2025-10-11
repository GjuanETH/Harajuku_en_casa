// src/Pages/Cart/CartPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import '../../assets/css/styles.css'; // Estilos globales
import '../../assets/css/pages/cart.css'; // Estilos específicos del carrito

function CartPage() {
  const { cartItems, totalItems, totalPrice, removeFromCart, updateQuantity, clearCart } = useCart();

  // Función para formatear números como moneda COP
  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0, // No mostrar decimales para COP si no los necesitas
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Contenido cuando el carrito está vacío
  const renderEmptyCart = () => (
    <div className="empty-cart" id="emptyCart">
      <div className="empty-cart-icon">🛒</div>
      <h3>¡Tu carrito está vacío!</h3>
      <p>Descubre nuestros productos kawaii y llénalo de alegría</p>
      <Link to="/productos" className="btn-primary btn-kawaii">
        <i className="fas fa-store"></i> Ir a Productos
      </Link>
    </div>
  );

  // Contenido cuando hay ítems en el carrito
  const renderCartWithItems = () => (
    <>
      <div id="cartItems" className="cart-items">
        {cartItems.map(item => (
          <div key={item._id} className="cart-item">
            <Link to={`/producto/${item._id}`} className="cart-item-image-link">
              <img
                src={item.imageUrl || '/src/assets/images/placeholder.png'}
                alt={item.name}
                className="cart-item-image"
              />
            </Link>
            <div className="cart-item-details">
              <Link to={`/producto/${item._id}`} className="cart-item-title">{item.name}</Link>
              <p className="cart-item-price">{formatNumber(item.price)} COP c/u</p>
              <div className="cart-item-quantity">
                <button
                  className="quantity-btn decrease-btn"
                  onClick={() => updateQuantity(item._id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >-</button>
                <span className="quantity">{item.quantity}</span>
                <button
                  className="quantity-btn increase-btn"
                  onClick={() => updateQuantity(item._id, item.quantity + 1)}
                >+</button>
              </div>
            </div>
            <div className="cart-item-total">
              <p>{formatNumber(item.price * item.quantity)} COP</p>
              <button
                className="remove-btn"
                onClick={() => removeFromCart(item._id)}
              ><i className="fas fa-trash"></i></button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="cart-total">
          <h3>Total: <span id="cartTotal">{formatNumber(totalPrice)}</span> COP</h3>
          <p className="shipping-note">✨ Envío gratis para compras superiores a $100.000</p>
        </div>
        <Link to="/pago" className="btn-primary btn-kawaii"> {/* Asegúrate de tener una ruta /pago */}
          <i className="fas fa-credit-card"></i> Proceder al Pago
        </Link>
        <Link to="/productos" className="continue-shopping">
          <i className="fas fa-arrow-left"></i> Seguir comprando
        </Link>
      </div>
    </>
  );

  return (
    <main className="cart-main-content"> {/* Un wrapper para el contenido principal del carrito */}
        {/* Elementos decorativos (pueden ser componentes o estar aquí directamente) */}
        <div className="kawaii-element blossom" style={{ top: '10%', left: '5%' }}>🌸</div>
        <div className="kawaii-element naruto" style={{ top: '40%', right: '10%' }}>🍥</div>
        <div className="kawaii-element ribbon" style={{ bottom: '20%', left: '15%' }}>🎀</div>

        <div className="container">
            <div className="cart-container">
                <h2 className="cart-title"><i className="fas fa-shopping-cart"></i> Mi Carrito Kawaii</h2>

                {totalItems === 0 ? renderEmptyCart() : renderCartWithItems()}
            </div>
        </div>
    </main>
  );
}

export default CartPage;