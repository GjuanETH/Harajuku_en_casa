// src/Pages/Checkout/CheckoutPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../../components/Notifications/NotificationSystem';
import '../../assets/css/styles.css'; // Estilos generales
import '../../assets/css/Pages/pago.css'; // Estilos específicos de pago

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
          <div key={product._id} className="order-item"> {/* Usar _id si viene de la base de datos */}
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
          name="zip"
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
  const [cart, setCart] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    phone: '',
    city: '',
    zip: '',
  });

  const calculateShipping = useCallback((currentSubtotal) => {
    return currentSubtotal > 100000 ? 0 : 10000;
  }, []);

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    if (storedCart.length === 0) {
      showNotification('Tu carrito está vacío, por favor añade productos para comprar.', 'info');
      navigate('/carrito');
      return;
    }
    setCart(storedCart);

    let currentSubtotal = storedCart.reduce((acc, product) => acc + (product.price * product.quantity), 0);
    let currentShipping = calculateShipping(currentSubtotal);
    let currentTotal = currentSubtotal + currentShipping;

    setSubtotal(currentSubtotal);
    setShipping(currentShipping);
    setTotal(currentTotal);

    const storedUser = JSON.parse(localStorage.getItem("currentUser"));
    if (storedUser) {
        setFormData({
            name: storedUser.name || '',
            email: storedUser.email || '',
            address: storedUser.address || '',
            phone: storedUser.phone || '',
            city: storedUser.city || '',
            zip: storedUser.zip || '',
        });
    }

  }, [calculateShipping, navigate, showNotification]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethod(method);
  };

  const handleSubmitPayment = async (event) => {
    event.preventDefault();

    const { name, email, address, city } = formData;
    if (!name || !email || !address || !city) {
      showNotification('Por favor, completa todos los campos obligatorios de envío.', 'error');
      return;
    }

    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500)); 

    const lastOrder = {
        orderNumber: Math.floor(100000 + Math.random() * 900000),
        total: total,
        products: cart,
        customer: formData,
        paymentMethod: selectedPaymentMethod,
        date: new Date().toISOString(),
        status: 'pending',
    };
    localStorage.setItem("lastOrder", JSON.stringify(lastOrder));
    localStorage.removeItem("cart");

    showNotification('Tu pedido ha sido recibido (simulado).', 'success');
    setIsLoading(false);
    navigate('/confirmacion');
  };


  return (
    <main className="checkout-container">
      {/* Elementos decorativos kawaii */}
      <div className="kawaii-element flower-top-left">🌸</div>
      <div className="kawaii-element naruto-middle-right">🍥</div>
      <div className="kawaii-element ribbon-bottom-left">🎀</div>

      {/* CLASE RENOMBRADA AQUÍ */}
      <div className="checkout-page-container"> 
        <h2 className="checkout-title"><i className="fas fa-credit-card"></i> Finalizar Compra</h2>

        <div className="checkout-content">
          <OrderSummary cartItems={cart} subtotal={subtotal} shipping={shipping} total={total} />

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
                            <i className="fas fa-lock"></i> Pagar ahora (Simulado)
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