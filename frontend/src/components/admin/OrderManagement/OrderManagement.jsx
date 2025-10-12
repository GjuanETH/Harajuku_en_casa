import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../../context/AuthContext'; // Asegúrate de que esta ruta sea correcta
import './OrderManagement.css'; // Crea este archivo CSS

const OrderManagement = () => {
    const { user, token } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

    useEffect(() => {
        if (user && token) {
            fetchOrders();
        }
    }, [user, token]);

    const fetchOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/orders`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(response.data);
        } catch (err) {
            console.error("Error al cargar pedidos:", err);
            setError("Error al cargar pedidos. " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        if (!window.confirm(`¿Estás seguro de cambiar el estado del pedido a "${newStatus}"?`)) {
            return;
        }
        try {
            const response = await axios.put(`${API_BASE_URL}/admin/orders/${orderId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order._id === orderId ? { ...order, status: response.data.order.status } : order
                )
            );
            if (selectedOrder && selectedOrder._id === orderId) {
                setSelectedOrder(prev => ({ ...prev, status: response.data.order.status }));
            }
            alert('Estado del pedido actualizado con éxito.');
        } catch (err) {
            console.error("Error al actualizar estado del pedido:", err);
            alert("Error al actualizar estado del pedido: " + (err.response?.data?.message || err.message));
        }
    };

    const openOrderDetails = (order) => {
        setSelectedOrder(order);
        setShowOrderModal(true);
    };

    const closeOrderDetails = () => {
        setShowOrderModal(false);
        setSelectedOrder(null);
    };

    if (!user || user.role !== 'admin') {
        return <div className="admin-management-container">Acceso denegado. Solo administradores.</div>;
    }

    if (loading) return <div className="admin-management-container">Cargando pedidos...</div>;
    if (error) return <div className="admin-management-container error-message">{error}</div>;

    const getStatusClass = (status) => {
        switch (status) {
            case 'pending': return 'status-pending';
            case 'processing': return 'status-processing';
            case 'shipped': return 'status-shipped';
            case 'delivered': return 'status-delivered';
            case 'cancelled': return 'status-cancelled';
            default: return '';
        }
    };

    return (
        <div className="admin-management-container">
            <h3>Gestión de Pedidos</h3>

            {orders.length === 0 ? (
                <p>No hay pedidos para mostrar.</p>
            ) : (
                <div className="order-list">
                    <table>
                        <thead>
                            <tr>
                                <th>Nº Pedido</th>
                                <th>Cliente</th>
                                <th>Email Cliente</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th>Fecha Pedido</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order._id}>
                                    <td>{order.orderNumber}</td>
                                    <td>{order.user?.profile?.name || 'N/A'}</td>
                                    <td>{order.userEmail}</td>
                                    <td>€{order.total.toFixed(2)}</td>
                                    <td>
                                        <span className={`order-status ${getStatusClass(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td className="order-actions">
                                        <button onClick={() => openOrderDetails(order)} className="btn-view-details">
                                            Ver Detalles
                                        </button>
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                                            className={`status-select ${getStatusClass(order.status)}`}
                                        >
                                            <option value="pending">Pendiente</option>
                                            <option value="processing">Procesando</option>
                                            <option value="shipped">Enviado</option>
                                            <option value="delivered">Entregado</option>
                                            <option value="cancelled">Cancelado</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showOrderModal && selectedOrder && (
                <div className="order-modal-overlay">
                    <div className="order-modal-content">
                        <h4>Detalles del Pedido: {selectedOrder.orderNumber}</h4>
                        <p><strong>Cliente:</strong> {selectedOrder.user?.profile?.name || 'N/A'}</p>
                        <p><strong>Email Cliente:</strong> {selectedOrder.userEmail}</p>
                        <p><strong>Fecha:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                        <p><strong>Estado:</strong> <span className={`order-status ${getStatusClass(selectedOrder.status)}`}>{selectedOrder.status}</span></p>
                        <p><strong>Total:</strong> €{selectedOrder.total.toFixed(2)}</p>

                        <h5>Artículos:</h5>
                        <div className="order-items-list">
                            {selectedOrder.items.map(item => (
                                <div key={item.productId} className="order-item-detail">
                                    <img src={item.imageUrl} alt={item.productName} className="order-item-img" />
                                    <span>{item.productName} (x{item.quantity}) - €{(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <h5>Dirección de Envío:</h5>
                        <p>{selectedOrder.shippingAddress.address}, {selectedOrder.shippingAddress.city}</p>
                        <p>{selectedOrder.shippingAddress.state}, {selectedOrder.shippingAddress.zipCode}</p>
                        <p>{selectedOrder.shippingAddress.country}</p>

                        <button onClick={closeOrderDetails} className="btn-close-modal">Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderManagement;