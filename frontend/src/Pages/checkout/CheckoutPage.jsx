// src/Pages/Checkout/CheckoutPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../../components/Notifications/NotificationSystem';
import '../../assets/css/styles.css'; // Estilos generales
import '../../assets/css/pages/pago.css'; // Estilos específicos de pago
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

// --- AÑADIDOS DE STRIPE ---
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

// Define la URL base: usa la variable de entorno en producción, o localhost en tu PC
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// --- Configuración de Stripe ---
// Intenta leer la variable de entorno, si no, usa la clave harcodeada (útil para pruebas rápidas)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51SS94DJNQOKghiA0y7LqRn1bIfVUwXhJyXDOFrFtAd7RoiQUaBbCptYjD1WjYn11Sh7BnubPNfsLjTwiocuJN4ZE00c5o9uEKR');

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
          name="zip"
          placeholder="Tu código postal"
          value={formData.zip}
          onChange={handleInputChange}
          required
        />
      </div>
    </div>
  </div>
);

// Componente del Formulario de Pago de Stripe
const StripePaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Redirige a la página de confirmación
        return_url: `${window.location.origin}/confirmacion`,
      },
    });

    if (error.type === "card_error" || error.type === "validation_error") {
      showNotification(error.message, 'error');
    } else {
      showNotification("Ocurrió un error inesperado al procesar el pago.", 'error');
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-payment-form">
      <h3><i className="fas fa-credit-card"></i> Datos de Pago</h3>
      <PaymentElement />
      <button 
        type="submit" 
        className="btn-primary btn-kawaii" 
        disabled={isLoading || !stripe || !elements}
        style={{ width: '100%', marginTop: '1.5rem' }}
      >
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
    </form>
  );
};


// --- COMPONENTE PRINCIPAL ---
function CheckoutPage() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { cartItems: cart } = useCart();
  const { token, user } = useAuth();

  const [subtotal, setSubtotal] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);

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
    if (cart.length === 0) {
      showNotification('Tu carrito está vacío, por favor añade productos para comprar.', 'info');
      navigate('/carrito');
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
        address: '', 
        phone: '',
        city: '',
        zip: '',
        country: 'Colombia',
        state: '',
      }));
    }
  }, [cart, calculateShipping, navigate, showNotification, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleShippingSubmit = async (event) => {
    event.preventDefault();

    const { name, email, address, city, zip, country } = formData;
    if (!name || !email || !address || !city || !zip || !country) {
      setTimeout(() => showNotification('Por favor, completa todos los campos obligatorios de envío.', 'error'), 0);
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
        shipping: shipping,
        shippingAddress: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zip,
          country: formData.country,
        },
      };

      // --- CORRECCIÓN PRINCIPAL: Usar API_BASE_URL ---
      const response = await fetch(`${API_BASE_URL}/payment/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear el intento de pago.');
      }

      const data = await response.json();
      console.log("Intento de pago creado:", data);

      setClientSecret(data.clientSecret);

    } catch (error) {
      console.error('Error al crear el intento de pago:', error);
      setTimeout(() => showNotification(`Error: ${error.message}`, 'error'), 0);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <main className="checkout-container">
      <div className="kawaii-element flower-top-left">🌸</div>
      <div className="kawaii-element naruto-middle-right">🍥</div>
      <div className="kawaii-element ribbon-bottom-left">🎀</div>

      <div className="checkout-page-container">
        <h2 className="checkout-title"><i className="fas fa-credit-card"></i> Finalizar Compra</h2>

        <div className="checkout-content">
          <OrderSummary cartItems={cart} subtotal={subtotal} shipping={shipping} total={subtotal + shipping} />

          <div className="payment-form">
            
            {!clientSecret ? (
              <form onSubmit={handleShippingSubmit}>
                <ShippingForm formData={formData} handleInputChange={handleInputChange} />
                <div className="form-actions">
                  <Link to="/carrito" className="btn-back">
                    <i className="fas fa-arrow-left"></i> Volver al carrito
                  </Link>
                  <button type="submit" className="btn-primary btn-kawaii" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Guardando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-arrow-right"></i> Continuar al Pago
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripePaymentForm />
              </Elements>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}

export default CheckoutPage;