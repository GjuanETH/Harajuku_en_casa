// src/components/Notifications/NotificationSystem.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import './NotificationSystem.css';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const timeoutRef = useRef(null); // Para guardar el ID del timeout de la notificación actual

  const showNotification = useCallback((message, type = 'info', duration = 3000) => {
    // Si ya hay un timeout activo para una notificación anterior, lo limpiamos
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const id = Date.now() + Math.random(); // ID único para cada notificación
    const newNotification = { id, message, type };

    // Opción 1: Mostrar solo una notificación a la vez (reemplazando la anterior)
    setNotifications([newNotification]); // Reemplaza todas las notificaciones anteriores con la nueva

    // Establecer un nuevo timeout para que la notificación desaparezca
    timeoutRef.current = setTimeout(() => {
      setNotifications([]); // Vacía el array para ocultar la notificación
      timeoutRef.current = null; // Limpiar la referencia al timeout
    }, duration);

  }, []); // El array vacío asegura que useCallback solo se ejecute una vez al montar

  // Limpiar el timeout si el componente se desmonta inesperadamente
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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