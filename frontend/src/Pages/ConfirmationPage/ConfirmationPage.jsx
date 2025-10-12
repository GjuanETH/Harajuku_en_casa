// src/Pages/ConfirmationPage/ConfirmationPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import './ConfirmationPage.css';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../components/Notifications/NotificationSystem';

// Función auxiliar para formatear números
const formatNumber = (num) => {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    return new Intl.NumberFormat('es-CO', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
};

function ConfirmationPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const [confirmedOrder, setConfirmedOrder] = useState(null);

    // Función para formatear la fecha de manera robusta
    const getFormattedDate = useCallback((dateString) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) { // Comprueba si la fecha es "Invalid Date"
                return 'Fecha no disponible';
            }
            return date.toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch (error) {
            console.error("Error al formatear la fecha:", error);
            return 'Fecha no disponible';
        }
    }, []);

    useEffect(() => {
        // 1. Intentar leer el objeto de respuesta del pedido desde el estado de la navegación
        const orderResponse = location.state?.orderDetails;

        // 2. Verificar si el objeto de respuesta y el objeto 'order' anidado existen
        if (orderResponse && orderResponse.order) {
            console.log("Datos del pedido recibidos desde CheckoutPage:", orderResponse.order);
            setConfirmedOrder(orderResponse.order); // <-- ¡CAMBIO CLAVE! Guardamos el objeto 'order' anidado
        } else {
            // 3. Si no hay datos, es un error o el usuario llegó por un camino incorrecto
            console.warn("No se encontraron detalles del pedido en el estado de la ruta. Redirigiendo...");
            showNotification("No se encontró información del pedido. Redirigiendo...", "error");
            setTimeout(() => {
                navigate('/perfil', { replace: true }); // Redirigir a la página de perfil
            }, 3000);
        }

        // Limpiar la clave de localStorage si la usabas antes, para evitar inconsistencias
        localStorage.removeItem("lastPlacedOrder");

    }, [location.state, navigate, showNotification]);

    if (!confirmedOrder) {
        // Mostrar un estado de carga mientras se obtienen los datos o se redirige
        return (
            <main className="confirmation-page-wrapper">
                <div className="confirmation-container">
                    <div className="confirmation-content" style={{ padding: '60px', textAlign: 'center' }}>
                        <h2 className="confirmation-content h2">Cargando confirmación de tu pedido...</h2>
                        <div className="text-center mt-4">
                            <i className="fas fa-spinner fa-spin fa-4x" style={{ color: 'var(--primary-pink)' }}></i>
                            <p className="mt-3 confirmation-message">Un momento por favor...</p>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    const userName = user?.profile?.name || user?.email?.split('@')[0] || 'Cliente';
    const orderDate = getFormattedDate(confirmedOrder.createdAt);

    return (
        <main className="confirmation-page-wrapper">
            {/* Elementos decorativos kawaii */}
            <div className="kawaii-element" style={{ top: '10%', left: '5%', transform: 'rotate(-15deg)' }}>🌸</div>
            <div className="kawaii-element" style={{ top: '25%', right: '10%', transform: 'rotate(20deg)' }}>🍥</div>
            <div className="kawaii-element" style={{ bottom: '15%', left: '8%', transform: 'rotate(5deg)' }}>🎀</div>
            <div className="kawaii-element" style={{ bottom: '5%', right: '5%', transform: 'rotate(-30deg)' }}>💖</div>

            <div className="confirmation-container">
                <div className="confirmation-content">
                    <div className="confirmation-icon">
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <h2>¡Gracias por tu Compra, <span className="text-pink-primary">{userName}</span>!</h2>
                    <p className="confirmation-message">Tu pedido <span className="fw-bold">{confirmedOrder.orderNumber}</span> ha sido recibido y está siendo procesado.</p>
                    <p className="confirmation-message text-muted">Recibirás un correo de confirmación con los detalles.</p>

                    <div className="order-details">
                        <h3>Resumen del Pedido</h3>
                        <div className="order-info">
                            <p><strong>Número de Pedido:</strong> <span>{confirmedOrder.orderNumber}</span></p>
                            <p><strong>Fecha del Pedido:</strong> <span>{orderDate}</span></p>
                            <p><strong>Estado:</strong> <span className="badge bg-success">{confirmedOrder.status}</span></p>
                            <p><strong>Total:</strong> <span className="order-total-price">${formatNumber(confirmedOrder.total)} COP</span></p>
                        </div>

                        <h4 className="mt-4">Productos:</h4>
                        <ul className="order-products-list">
                            {confirmedOrder.items.map((item, index) => (
                                <li key={item.productId || index} className="order-product-item">
                                    <img src={item.imageUrl} alt={item.productName} className="order-product-image" />
                                    <div className="order-product-details">
                                        <span className="order-product-name">{item.productName}</span>
                                        <span className="order-product-quantity">{item.quantity} x ${formatNumber(item.price)}</span>
                                        <span className="order-product-price">Total: ${formatNumber(item.quantity * item.price)} COP</span>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <h4 className="mt-4">Dirección de Envío:</h4>
                        <div className="shipping-address-details">
                            {confirmedOrder.shippingAddress ? (
                                <>
                                    <p>{confirmedOrder.shippingAddress.address}</p>
                                    <p>
                                        {confirmedOrder.shippingAddress.city}
                                        {confirmedOrder.shippingAddress.state ? `, ${confirmedOrder.shippingAddress.state}` : ''}
                                    </p>
                                    <p>
                                        {confirmedOrder.shippingAddress.zipCode}
                                        {confirmedOrder.shippingAddress.country ? `, ${confirmedOrder.shippingAddress.country}` : ''}
                                    </p>
                                </>
                            ) : (
                                <p>No hay información de dirección de envío disponible.</p>
                            )}
                        </div>
                    </div>

                    <div className="logo-celebration">
                        <img src="/src/assets/images/logo.png" alt="Logo Harajuku en Casa" className="confirmation-logo" />
                        <p className="celebration-text">¡Gracias por elegirnos y hacer magia con tus outfits!</p>
                    </div>

                    <div className="confirmation-actions">
                        <Link to="/productos" className="btn-primary btn-kawaii">
                            <i className="fas fa-shopping-bag"></i> Seguir Comprando
                        </Link>
                        <Link to="/perfil" className="btn-secondary">
                            <i className="fas fa-boxes"></i> Ver mis Pedidos
                        </Link>
                    </div>

                    <p className="confirmation-note">
                        Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos.
                    </p>
                </div>
            </div>
        </main>
    );
}

export default ConfirmationPage;