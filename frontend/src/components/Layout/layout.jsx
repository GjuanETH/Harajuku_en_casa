// src/Layout/layout.jsx
import React from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import { Outlet } from 'react-router-dom';
import './layout.css'; // <-- ¡IMPORTA ESTE CSS!

function Layout() {
  return (
    <div className="app-container">
      <Header />
      <main className="main-content" id="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
export default Layout;