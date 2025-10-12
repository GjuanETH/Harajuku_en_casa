// src/Pages/Checkout/CheckoutPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../../components/Notifications/NotificationSystem';
import '../../assets/css/styles.css'; // Estilos generales
import '../../assets/css/Pages/pago.css'; // Estilos específicos de pago
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext'; // Importar useAuth para el token
// Importar Axios si lo prefieres, aunque usas fetch en tu código actual
// import axios from 'axios'; 

// Función auxiliar para formatear números
const formatNumber = (num) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

// Componente para el resumen del pedido
const OrderSummary = ({ cartItems, subtotal, shipping, total }) => (
  <div className="order-summary">
    <h3><i className="fas fa-receipt"></i> Resumen de tu pedido</h3>
    <div className="order-items">
      {cartItems.length === 0 ? (
        <p>Tu carrito está vacío.</p>
      ) : (
        cartItems.map(product => (
          <div key={product._id} className="order-item">
            <div className="order-item-image">
              <img src={product.imageUrl || '/src/assets/images/placeholder.png'} alt={product.name} />
            </div>
            <div className="order-item-info">
              <h4>{product.name}</h4>
              <p>{product.quantity} x ${formatNumber(product.price)}</p>
            </div>
            <div className="order-item-total">$<span>{formatNumber(product.price * product.quantity)}</span></div>
          </div>
        ))
      )}
    </div>
    <div className="order-totals">
      <div className="order-line">
        <span>Subtotal:</span>
        <span>$<span id="subtotal">{formatNumber(subtotal)}</span> COP</span>
      </div>
      <div className="order-line">
        <span>Envío:</span>
        <span>$<span id="shipping">{formatNumber(shipping)}</span> COP</span>
      </div>
      <div className="order-line total">
        <span>Total:</span>
        <span>$<span id="total">{formatNumber(total)}</span> COP</span>
      </div>
    </div>
  </div>
);

// Componente para el formulario de envío
const ShippingForm = ({ formData, handleInputChange }) => (
  <div className="form-section">
    <h3><i className="fas fa-truck"></i> Información de envío</h3>
    <div className="form-row">
      <div className="form-group">
        <label htmlFor="name">Nombre completo</label>
        <input
          type="text"
          id="name"
          name="name"
          placeholder="Tu nombre completo"
          value={formData.name}
          onChange={handleInputChange}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="email">Correo electrónico</label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="tu@email.com"
          value={formData.email}
          onChange={handleInputChange}
          required
        />
      </div>
    </div>
    <div className="form-row">
      <div className="form-group">
        <label htmlFor="address">Dirección</label>
        <input
          type="text"
          id="address"
          name="address"
          placeholder="Tu dirección"
          value={formData.address}
          onChange={handleInputChange}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="phone">Teléfono</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          placeholder="Tu teléfono"
          value={formData.phone}
          onChange={handleInputChange}
        />
      </div>
    </div>
    <div className="form-row">
      <div className="form-group">
        <label htmlFor="city">Ciudad</label>
        <input
          type="text"
          id="city"
          name="city"
          placeholder="Tu ciudad"
          value={formData.city}
          onChange={handleInputChange}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="zip">Código postal</label>
        <input
          type="text"
          id="zip"
          name="zip" // Usamos 'zip' aquí en el formulario, pero recuerda mapear a 'zipCode' para el backend
          placeholder="Tu código postal"
          value={formData.zip}
          onChange={handleInputChange}
        />
      </div>
    </div>
  </div>
);

// Componente para el selector de método de pago (simplificado)
const PaymentMethodSelector = ({ selectedMethod, handleMethodChange }) => (
  <div className="form-section">
    <h3><i className="fas fa-credit-card"></i> Método de pago</h3>
    <div className="payment-options">
      <div
        className={`payment-option ${selectedMethod === 'card' ? 'active' : ''}`}
        onClick={() => handleMethodChange('card')}
        data-method="card"
      >
        <i className="fas fa-credit-card"></i>
        <span>Tarjeta de crédito/débito</span>
      </div>
      <div
        className={`payment-option ${selectedMethod === 'pse' ? 'active' : ''}`}
        onClick={() => handleMethodChange('pse')}
        data-method="pse"
      >
        <i className="fas fa-university"></i>
        <span>PSE</span>
      </div>
      <div
        className={`payment-option ${selectedMethod === 'cash' ? 'active' : ''}`}
        onClick={() => handleMethodChange('cash')}
        data-method="cash"
      >
        <i className="fas fa-money-bill-wave"></i>
        <span>Efectivo</span>
      </div>
    </div>
    {/* Contenedor para el "formulario" de Mercado Pago, solo mostrará mensajes por ahora */}
    <div id="mercadoPagoForm" className="mercado-pago-form">
      {selectedMethod === 'card' && <p className="mp-message">El formulario de pago con tarjeta se cargará aquí.</p>}
      {selectedMethod === 'pse' && <p className="mp-message">Redireccionando a la pasarela PSE al confirmar el pago.</p>}
      {selectedMethod === 'cash' && <p className="mp-message">Instrucciones para pago en efectivo se mostrarán al confirmar el pedido.</p>}
    </div>
  </div>
);


function CheckoutPage() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { cartItems: cart, clearCart } = useCart();
  const { token, user } = useAuth();

  const [subtotal, setSubtotal] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  // NUEVO ESTADO: Para controlar si el pedido ya se ha procesado
  const [orderProcessed, setOrderProcessed] = useState(false); 

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    phone: '',
    city: '',
    zip: '',
    country: 'Colombia',
    state: '',
  });

  const calculateShipping = useCallback((currentSubtotal) => {
    return currentSubtotal > 100000 ? 0 : 10000;
  }, []);

  useEffect(() => {
    // Solo verifica el carrito vacío si un pedido NO ha sido procesado aún
    if (cart.length === 0 && !orderProcessed) { // <<-- ¡CAMBIO CLAVE AQUÍ!
      showNotification('Tu carrito está vacío, por favor añade productos para comprar.', 'info');
      navigate('/carrito');
      return;
    }
    
    // Si el carrito está vacío pero ya procesamos un pedido, no hagas nada (para evitar el loop)
    if (cart.length === 0 && orderProcessed) {
        return; 
    }

    let currentSubtotal = cart.reduce((acc, product) => acc + (product.price * product.quantity), 0);
    let currentShipping = calculateShipping(currentSubtotal);
    setSubtotal(currentSubtotal);
    setShipping(currentShipping);

    if (user) {
        setFormData(prevData => ({
            ...prevData,
            name: user.profile?.name || '',
            email: user.email || '',
            address: user.profile?.shippingAddress?.address || '',
            phone: user.profile?.phone || '', 
            city: user.profile?.shippingAddress?.city || '',
            zip: user.profile?.shippingAddress?.zipCode || '', 
            country: user.profile?.shippingAddress?.country || 'Colombia',
            state: user.profile?.shippingAddress?.state || '',
        }));
    }
  }, [cart, calculateShipping, navigate, showNotification, user, orderProcessed]); // <<-- Añadir orderProcessed a las dependencias

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethod(method);
  };

  const handleSubmitPayment = async (event) => {
    event.preventDefault();

    const { name, email, address, city, zip, country } = formData;
    if (!name || !email || !address || !city || !zip || !country) {
      setTimeout(() => showNotification('Por favor, completa todos los campos obligatorios de envío (nombre, email, dirección, ciudad, código postal, país).', 'error'), 0);
      return;
    }

    if (!token) {
      setTimeout(() => showNotification('Debes iniciar sesión para completar la compra.', 'error'), 0);
      navigate('/login');
      return;
    }

    setIsLoading(true);

    try {
        const orderItems = cart.map(item => ({
            productId: item._id, 
            productName: item.name,
            quantity: item.quantity,
            price: item.price,
            imageUrl: item.imageUrl
        }));

        const orderTotal = subtotal + shipping;

        const orderData = {
            items: orderItems,
            total: orderTotal,
            shippingAddress: {
                address: formData.address,
                city: formData.city,
                state: formData.state,
                zipCode: formData.zip,
                country: formData.country,
            },
            paymentMethod: selectedPaymentMethod,
        };

        console.log("Datos del pedido que se enviarán al backend:", orderData);

        const response = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error desconocido al crear el pedido.');
        }

        const newOrder = await response.json();
        console.log("Pedido creado exitosamente en el backend:", newOrder);

        // Limpiar el carrito en el frontend solo si el pedido se creó exitosamente
        clearCart(); 

        // ESTO ES CLAVE: Marcar que el pedido fue procesado ANTES de navegar
        setOrderProcessed(true); // <<-- ¡NUEVA LÍNEA!

        // Notificaciones también pospuestas
        setTimeout(() => showNotification('Pedido procesado exitosamente. Dirigiéndote a la página de confirmación.', 'success'), 0);
        
        // Ahora navega
        navigate('/confirmacion', { state: { orderDetails: newOrder } });

    } catch (error) {
        console.error('Error al enviar el pedido:', error);
        setTimeout(() => showNotification(`Error al procesar el pago: ${error.message}`, 'error'), 0);
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <main className="checkout-container">
      {/* ... (Elementos decorativos y el resto del JSX) ... */}
      <div className="kawaii-element flower-top-left">🌸</div>
      <div className="kawaii-element naruto-middle-right">🍥</div>
      <div className="kawaii-element ribbon-bottom-left">🎀</div>

      <div className="checkout-page-container">
        <h2 className="checkout-title"><i className="fas fa-credit-card"></i> Finalizar Compra</h2>

        <div className="checkout-content">
          <OrderSummary cartItems={cart} subtotal={subtotal} shipping={shipping} total={subtotal + shipping} />

          <div className="payment-form">
            <form onSubmit={handleSubmitPayment}>
              <ShippingForm formData={formData} handleInputChange={handleInputChange} />
              <PaymentMethodSelector
                selectedMethod={selectedPaymentMethod}
                handleMethodChange={handlePaymentMethodChange}
              />

              <div className="form-actions">
                <Link to="/carrito" className="btn-back">
                  <i className="fas fa-arrow-left"></i> Volver al carrito
                </Link>
                <button type="submit" className="btn-primary btn-kawaii" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <i className="fas fa-spinner fa-spin"></i> Procesando...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-lock"></i> Pagar ahora
                        </>
                    )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

export default CheckoutPage;