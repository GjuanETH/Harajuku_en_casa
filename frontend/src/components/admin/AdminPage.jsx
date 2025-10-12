import React, { useState } from 'react';
import './AdminPage.css';
import ProductManagement from './ProductManagement/ProductManagement';
import UserManagement from './UserManagement/UserManagement';
import OrderManagement from './OrderManagement/OrderManagement'; // <<-- ¡NUEVA IMPORTACIÓN!
import { useContext } from 'react'; // Para usar AuthContext
import { AuthContext } from '../../context/AuthContext'; // Asegúrate de que esta ruta sea correcta

const AdminPage = () => {
    const { user, loading: authLoading } = useContext(AuthContext); // Obtener user y loading del contexto
    const [activeTab, setActiveTab] = useState('products'); // 'products', 'users', 'orders'

    // Mientras el contexto de autenticación carga, o si no hay usuario o no es admin
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
                    </div>
                </nav>

                <div id="admin-content-area">
                    {activeTab === 'products' && <ProductManagement />}
                    {activeTab === 'users' && <UserManagement />}
                    {activeTab === 'orders' && <OrderManagement />} {/* <<-- ¡RENDERIZADO DEL COMPONENTE! */}
                </div>
            </div>
        </div>
    );
};

export default AdminPage;