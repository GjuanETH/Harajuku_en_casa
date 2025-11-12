// src/Pages/ConfirmationPage/ConfirmationPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import './ConfirmationPage.css';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../components/Notifications/NotificationSystem';
// --- 1. IMPORTAR EL CONTEXTO DEL CARRITO ---
import { useCart } from '../../context/CartContext'; 

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
    const { user, token } = useAuth();
    const { showNotification } = useNotification();
    // --- 2. OBTENER LA FUNCIÓN clearCart ---
    const { clearCart } = useCart(); 
    
    const [confirmedOrder, setConfirmedOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Función para formatear la fecha
    const getFormattedDate = useCallback((dateString) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Fecha no disponible';
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
        const searchParams = new URLSearchParams(location.search);
        const paymentIntentId = searchParams.get('payment_intent');

        if (!paymentIntentId) {
            showNotification("ID de pago no encontrado. Redirigiendo...", "error");
            navigate('/perfil', { replace: true });
            return;
        }

        if (!token) {
            showNotification("Sesión no encontrada. Redirigiendo...", "error");
            navigate('/login', { replace: true });
            return;
        }

        const fetchOrder = async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/orders/by-payment-intent/${paymentIntentId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.status === 200) {
                    // ¡La encontramos!
                    const data = await response.json();
                    setConfirmedOrder(data.order);
                    setIsLoading(false);
                    
                    // --- 3. ¡AQUÍ ESTÁ LA MAGIA! ---
                    // Limpia el estado del carrito en el frontend.
                    clearCart();
                    
                    return true; // Detener el polling
                }

                if (response.status === 404) {
                    console.log("Orden aún no encontrada, reintentando...");
                    return false;
                }
                
                throw new Error("Error del servidor al buscar la orden.");

            } catch (err) {
                console.error(err);
                setError("No se pudo cargar la confirmación de tu pedido. Por favor, revisa tu perfil o contacta a soporte.");
                setIsLoading(false);
                return true; // Detener el polling por error
            }
        };

        const intervalId = setInterval(async () => {
            const orderFound = await fetchOrder();
            if (orderFound) {
                clearInterval(intervalId);
            }
        }, 2000); 

        const timeoutId = setTimeout(() => {
            clearInterval(intervalId);
            if (!confirmedOrder) {
                setError("El procesamiento de tu pedido está tardando más de lo esperado. Revisa tu perfil en 'Mis Pedidos' en un momento.");
                setIsLoading(false);
                showNotification("El pedido está tardando en procesar. Revisa tu perfil en breve.", "warning");
            }
        }, 30000);

        return () => {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
        };

    // --- 4. AÑADIR clearCart A LAS DEPENDENCIAS ---
    }, [location.search, navigate, showNotification, token, clearCart]);

    // --- ESTADO DE CARGA O ERROR ---
    if (isLoading || error || !confirmedOrder) {
        return (
            <main className="confirmation-page-wrapper">
                <div className="confirmation-container">
                    <div className="confirmation-content" style={{ padding: '60px', textAlign: 'center' }}>
                        
                        {isLoading && (
                            <>
                                <h2 className="confirmation-content h2">Confirmando tu pedido...</h2>
                                <div className="text-center mt-4">
                                    <i className="fas fa-spinner fa-spin fa-4x" style={{ color: 'var(--primary-pink)' }}></i>
                                    <p className="mt-3 confirmation-message">¡Tu pago fue exitoso! Estamos generando tu orden...</p>
                                </div>
                            </>
                        )}
                        
                        {error && (
                             <>
                                <h2 className="confirmation-content h2" style={{color: 'var(--danger-red)'}}>Algo salió mal</h2>
                                <div className="text-center mt-4">
                                    <i className="fas fa-times-circle fa-4x" style={{ color: 'var(--danger-red)' }}></i>
                                    <p className="mt-3 confirmation-message">{error}</p>
                                    <Link to="/perfil" className="btn-secondary" style={{marginTop: '20px'}}>
                                        <i className="fas fa-boxes"></i> Ir a mis Pedidos
                                    </Link>
                                </div>
                            </>
                        )}

                    </div>
                </div>
            </main>
        );
    }

    // --- ESTADO DE ÉXITO ---
    // (El resto del JSX de éxito es idéntico)
    const userName = user?.profile?.name || user?.email?.split('@')[0] || 'Cliente';
    const orderDate = getFormattedDate(confirmedOrder.createdAt);

    return (
        <main className="confirmation-page-wrapper">
            {/* ... (elementos decorativos) ... */}
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