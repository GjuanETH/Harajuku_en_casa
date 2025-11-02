// src/components/admin/AdminPage.jsx
import React, { useState, useContext } from 'react';
import './AdminPage.css';
import ProductManagement from './ProductManagement/ProductManagement';
import UserManagement from './UserManagement/UserManagement';
import OrderManagement from './OrderManagement/OrderManagement';
// Importa tu AdminReportsPage desde la ruta correcta
import AdminReportsPage from './AdminReport/AdminReportPage'; // <-- ¡IMPORTACIÓN ACTUALIZADA!
import { AuthContext } from '../../context/AuthContext';

const AdminPage = () => {
    const { user, loading: authLoading } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('products'); // 'products', 'users', 'orders', 'moderation'

    if (authLoading) {
        return (
            <div className="admin-main">
                <div className="container">
                    <div className="loading-message">Cargando información de usuario...</div>
                </div>
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return (
            <div className="admin-main">
                <div className="container">
                    <div className="access-denied">
                        Acceso denegado. Debes ser administrador para ver esta página.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-main">
            <div className="container admin-page-content-wrapper">
                <h2>Panel de Administración</h2>

                <nav className="admin-nav">
                    <div className="admin-tab-buttons">
                        <button
                            className={activeTab === 'products' ? 'active' : ''}
                            onClick={() => setActiveTab('products')}
                        >
                            Gestión de Productos
                        </button>
                        <button
                            className={activeTab === 'users' ? 'active' : ''}
                            onClick={() => setActiveTab('users')}
                        >
                            Gestión de Usuarios
                        </button>
                        <button
                            className={activeTab === 'orders' ? 'active' : ''}
                            onClick={() => setActiveTab('orders')}
                        >
                            Gestión de Pedidos
                        </button>
                        {/* ¡NUEVO BOTÓN PARA MODERACIÓN! */}
                        <button
                            className={activeTab === 'moderation' ? 'active' : ''}
                            onClick={() => setActiveTab('moderation')}
                        >
                            Moderación (Reportes)
                        </button>
                    </div>
                </nav>

                <div id="admin-content-area">
                    {activeTab === 'products' && <ProductManagement />}
                    {activeTab === 'users' && <UserManagement />}
                    {activeTab === 'orders' && <OrderManagement />}
                    {/* ¡RENDERIZA TU ADMINREPORTSPAGE! */}
                    {activeTab === 'moderation' && <AdminReportsPage />}
                </div>
            </div>
        </div>
    );
};

export default AdminPage;