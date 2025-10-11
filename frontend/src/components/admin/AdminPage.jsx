// src/components/Admin/AdminPage.jsx
import React, { useState } from 'react';
import './AdminPage.css'; // Asegúrate de importar tu CSS de AdminPage
import ProductManagement from './ProductManagement/ProductManagement'; // Asegúrate de la ruta correcta
// Importa otros componentes de gestión si los tienes (Users, Orders)

const AdminPage = () => {
    const [activeTab, setActiveTab] = useState('products'); // 'products', 'users', 'orders'

    // Simulación de autenticación/autorización
    const isAuthenticated = true; // Deberías obtener esto de tu contexto de autenticación real
    const isAdmin = true; // Deberías obtener esto de tu contexto de autenticación real

    if (!isAuthenticated || !isAdmin) {
        return (
            <div className="admin-main">
                {/* Contenedor principal para toda la página de admin, incluyendo el mensaje de acceso denegado */}
                <div className="container"> {/* Usa el contenedor global aquí para centrar el mensaje */}
                    <div className="access-denied">
                        Acceso denegado. Debes ser administrador para ver esta página.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-main">
            {/* ESTE ES EL DIV CLAVE: Contiene TODO el contenido visible del panel de administración,
                desde el título principal hasta el contenido de las pestañas.
                Así, todo se centrará y tendrá el mismo fondo si así lo deseas. */}
            <div className="container admin-page-content-wrapper"> 
                
                {/* 1. Título principal del Panel de Administración */}
                <h2>Panel de Administración</h2>

                {/* 2. Navegación por pestañas */}
                <nav className="admin-nav">
                    <ul>
                        <li>
                            <button
                                className={activeTab === 'products' ? 'active' : ''}
                                onClick={() => setActiveTab('products')}
                            >
                                Gestión de Productos
                            </button>
                        </li>
                        <li>
                            <button
                                className={activeTab === 'users' ? 'active' : ''}
                                onClick={() => setActiveTab('users')}
                            >
                                Gestión de Usuarios
                            </button>
                        </li>
                        <li>
                            <button
                                className={activeTab === 'orders' ? 'active' : ''}
                                onClick={() => setActiveTab('orders')}
                            >
                                Gestión de Pedidos
                            </button>
                        </li>
                    </ul>
                </nav>

                {/* 3. Área de contenido de las pestañas (la tabla y el botón "Añadir" estarán aquí) */}
                <div id="admin-content-area">
                    {activeTab === 'products' && <ProductManagement />}
                    {/* Renderiza tus otros componentes de gestión aquí */}
                    {activeTab === 'users' && <div>Contenido de Gestión de Usuarios</div>}
                    {activeTab === 'orders' && <div>Contenido de Gestión de Pedidos</div>}
                </div>
            </div> {/* <-- Cierra el div.container y el wrapper */}
        </div>
    );
};

export default AdminPage;