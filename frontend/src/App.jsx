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
import UserProfile from './components/UserProfile/UserProfile';
import ForumPage from './Pages/Foro/ForumPage';
import PostDetailPage from './Pages/Foro/PostDetailPage'; // CAMBIO AQUÍ: Importar PostDetailPage
// CAMBIO CLAVE AQUÍ: La ruta de importación correcta
import ConfirmationPage from './Pages/ConfirmationPage/ConfirmationPage'; // <-- CORREGIDO

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
                <Route path="confirmacion" element={<ConfirmationPage />} />
                <Route path="foro" element={<ForumPage />} />
                <Route path="foro/post/:postId" element={<PostDetailPage />} /> {/* CAMBIO AQUÍ */}
                
                {/* --- Mueve la ruta de AdminPage AQUÍ para que use el Layout --- */}
                <Route path="admin" element={<AdminPage />} />
                <Route path="perfil" element={<UserProfile />} />
                

                
              </Route>
              
            </Routes>
          </CartProvider> 
        </AuthProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;