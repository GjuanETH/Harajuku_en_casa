// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { NotificationProvider } from './components/Notifications/NotificationSystem';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import Layout from './components/Layout/Layout';
import Inicio from './Pages/Inicio/inicio';
import Productos from './Pages/Productos/productos';
import Login from './Pages/Auth/Login';
import Register from './Pages/Auth/Register';
import CartPage from './Pages/carrito/CartPage';
import CheckoutPage from './Pages/checkout/CheckoutPage';

// Importación de AdminPage
import AdminPage from './components/Admin/AdminPage'; 

function App() {
  return (
    <Router>
      <NotificationProvider>
        <AuthProvider>
          <CartProvider> 
            <Routes>
              {/* Esta ruta con Layout ahora envolverá todas las páginas, incluyendo el admin */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Inicio />} />
                <Route path="productos" element={<Productos />} />
                <Route path="login" element={<Login />} />
                <Route path="registro" element={<Register />} />
                <Route path="carrito" element={<CartPage />} /> 
                <Route path="pago" element={<CheckoutPage />} /> 
                
                {/* --- Mueve la ruta de AdminPage AQUÍ para que use el Layout --- */}
                <Route path="admin" element={<AdminPage />} /> 
                
              </Route>
              
              {/* ELIMINA esta línea: <Route path="/admin" element={<AdminPage />} /> */}
              {/* Ahora, AdminPage es una ruta anidada y automáticamente tendrá el Header y Footer de Layout */}

            </Routes>
          </CartProvider> 
        </AuthProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;