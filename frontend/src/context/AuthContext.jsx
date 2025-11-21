// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNotification } from '../components/Notifications/NotificationSystem';
import { useNavigate } from 'react-router-dom'; 

export const AuthContext = createContext();

// --- CORRECCIÓN PRINCIPAL: Usar la variable de entorno para producción ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail'));
    const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));
    const [isLoggedIn, setIsLoggedIn] = useState(!!token);
    const [user, setUser] = useState(null); 
    const navigate = useNavigate();

    const { showNotification } = useNotification();

    useEffect(() => {
        setIsLoggedIn(!!token);
        if (token) {
            fetchUserData(token);
        } else {
            setUser(null);
        }
    }, [token]);

    // Función para cargar los datos del usuario
    const fetchUserData = async (currentToken) => {
        if (!currentToken) {
            setUser(null);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/perfil`, { 
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                // Almacena solo los IDs de la wishlist
                const userWishlistIds = data.userData.wishlist ? data.userData.wishlist.map(item => item._id) : [];
                setUser({ ...data.userData, wishlist: userWishlistIds }); 
            } else if (response.status === 401) {
                logout(); 
            } else {
                console.error('Error al cargar datos del usuario:', response.statusText);
                setUser(null);
            }
        } catch (error) {
            console.error('Error de red al cargar datos del usuario:', error);
            setUser(null);
        }
    };

    const login = async (email, password) => {
        try {
            // --- Usando la URL dinámica ---
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

    const register = async (userData) => {
        try {
            // --- Usando la URL dinámica ---
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
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
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        localStorage.removeItem('cart'); 
        setToken(null);
        setUserEmail(null);
        setUserRole(null);
        setUser(null); 
        showNotification("Sesión cerrada correctamente.", "info");
        navigate('/login'); 
    };

    const isAdmin = userRole === 'admin';

    const refreshUserData = () => {
        if (token) {
            fetchUserData(token);
        }
    };

    const authContextValue = {
        token,
        userEmail,
        userRole,
        isLoggedIn,
        isAdmin,
        user, 
        login,
        register,
        logout,
        refreshUserData, 
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};