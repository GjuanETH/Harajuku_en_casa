// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNotification } from '../components/Notifications/NotificationSystem'; // Ruta correcta ahora

// 1. Crear y exportar el Contexto (exportación nombrada)
export const AuthContext = createContext();

// URL base de tu API (ajústala si es diferente)
const API_BASE_URL = 'http://localhost:3000/api';

// 2. Crear el Proveedor del Contexto (exportación nombrada)
// NOTA: El componente proveedor NO necesita ser la exportación default para este patrón.
// Es común exportar el componente y el hook de esta manera.
export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail'));
    const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));
    const [isLoggedIn, setIsLoggedIn] = useState(!!token);

    const { showNotification } = useNotification(); // Usa el hook de notificación aquí

    useEffect(() => {
        setIsLoggedIn(!!token);
    }, [token]);

    const login = async (email, password) => {
        // ... (tu lógica de login, ya está bien) ...
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userEmail', data.userEmail);
                localStorage.setItem('userRole', data.userRole);
                setToken(data.token);
                setUserEmail(data.userEmail);
                setUserRole(data.userRole);
                showNotification("¡Inicio de sesión exitoso! Bienvenido.", "success");
                return { success: true, message: data.message };
            } else {
                showNotification(data.message || "Error al iniciar sesión.", "error");
                return { success: false, message: data.message || "Error al iniciar sesión." };
            }
        } catch (error) {
            console.error("Error en el login:", error);
            showNotification("No se pudo conectar con el servidor.", "error");
            return { success: false, message: "Error de conexión." };
        }
    };

    const register = async (userData) => { // userData contendrá { fullName, email, phone, address, password }
        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData), // Envía el objeto completo
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userEmail', data.userEmail);
                localStorage.setItem('userRole', data.userRole);
                setToken(data.token);
                setUserEmail(data.userEmail);
                setUserRole(data.userRole);
                showNotification("¡Registro exitoso! Bienvenido.", "success");
                return { success: true, message: data.message };
            } else {
                showNotification(data.message || "Error al registrarse.", "error");
                return { success: false, message: data.message || "Error al registrarse." };
            }
        } catch (error) {
            console.error("Error en el registro:", error);
            showNotification("No se pudo conectar con el servidor.", "error");
            return { success: false, message: "Error de conexión." };
        }
    };

    const logout = () => {
        // ... (tu lógica de logout, ya está bien) ...
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        localStorage.removeItem('cart');
        setToken(null);
        setUserEmail(null);
        setUserRole(null);
        showNotification("Sesión cerrada correctamente.", "info");
    };

    const isAdmin = userRole === 'admin';

    const authContextValue = {
        token,
        userEmail,
        userRole,
        isLoggedIn,
        isAdmin,
        login,
        register,
        logout,
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// 3. Hook personalizado para consumir el contexto fácilmente (exportación nombrada)
export const useAuth = () => {
    return useContext(AuthContext);
};