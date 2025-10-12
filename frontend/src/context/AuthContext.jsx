import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNotification } from '../components/Notifications/NotificationSystem';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate

export const AuthContext = createContext();

const API_BASE_URL = 'http://localhost:3000/api';

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail'));
    const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));
    const [isLoggedIn, setIsLoggedIn] = useState(!!token);
    const [user, setUser] = useState(null); // <-- Nuevo estado para almacenar los datos completos del usuario
    const navigate = useNavigate(); // Inicializar useNavigate

    const { showNotification } = useNotification();

    useEffect(() => {
        setIsLoggedIn(!!token);
        if (token) {
            fetchUserData(token); // Cargar datos del usuario al cargar el token
        } else {
            setUser(null); // Limpiar datos si no hay token
        }
    }, [token]);

    // Función para cargar los datos del usuario, incluyendo la wishlist
    const fetchUserData = async (currentToken) => {
        if (!currentToken) {
            setUser(null);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/perfil`, { // Ruta para obtener el perfil del usuario
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                // Almacena solo los IDs de la wishlist para una fácil comparación en ProductCard
                const userWishlistIds = data.userData.wishlist ? data.userData.wishlist.map(item => item._id) : [];
                setUser({ ...data.userData, wishlist: userWishlistIds }); // <-- Guardar wishlist como array de IDs
            } else if (response.status === 401) {
                logout(); // Token inválido o expirado
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
                // fetchUserData se ejecutará automáticamente por el useEffect después de setToken
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
                // fetchUserData se ejecutará automáticamente por el useEffect
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
        localStorage.removeItem('cart'); // Asumo que el carrito también se limpia
        setToken(null);
        setUserEmail(null);
        setUserRole(null);
        setUser(null); // Limpiar datos completos del usuario
        showNotification("Sesión cerrada correctamente.", "info");
        navigate('/login'); // Redirigir al logout
    };

    const isAdmin = userRole === 'admin';

    // Función para refrescar los datos del usuario
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
        user, // <-- Exporta el objeto user completo
        login,
        register,
        logout,
        refreshUserData, // <-- Exporta la función para refrescar los datos del usuario
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