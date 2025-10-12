// src/components/Notifications/NotificationSystem.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './NotificationSystem.css';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // useCallback para showNotification para evitar recrearlo innecesariamente
  const showNotification = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    const newNotification = { id, message, type, duration }; // Incluir duration en el objeto

    setNotifications((prevNotifications) => [...prevNotifications, newNotification]);
  }, []); // Dependencias vacías porque setNotifications es una función de React estable

  // useEffect para manejar la eliminación automática de notificaciones
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications((prevNotifications) => prevNotifications.slice(1)); // Elimina la primera notificación
      }, notifications[0].duration); // Usa la duración de la primera notificación

      return () => {
        clearTimeout(timer);
      };
    }
  }, [notifications]); // Se ejecuta cuando 'notifications' cambia

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {createPortal(
        <div className="notification-container">
          {notifications.map((notification) => (
            <div key={notification.id} className={`notification-item notification-${notification.type}`}>
              {notification.message}
            </div>
          ))}
        </div>,
        document.body
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};