// src/components/ProductCard/ProductCard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../components/Notifications/NotificationSystem';
import { useAuth } from '../../context/AuthContext';
import './ProductCart.css';

// Definir la URL fuera del componente
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

function ProductCard({ product }) {
    const { addToCart } = useCart();
    const { showNotification } = useNotification();
    const { token, user, refreshUserData } = useAuth();

    const [isFavorite, setIsFavorite] = useState(false);

    // --- CORRECCIÓN PRINCIPAL ---
    // Efecto para verificar si es favorito
    useEffect(() => {
        if (user && user.wishlist && product && product._id) {
            // Usamos .some() en lugar de .includes() para ser más robustos.
            // Esto funciona tanto si la wishlist tiene objetos completos (poblados) o solo IDs strings.
            const isFav = user.wishlist.some(item => {
                const itemId = (typeof item === 'object' && item !== null) ? item._id : item;
                return itemId === product._id;
            });
            setIsFavorite(isFav);
        } else {
            setIsFavorite(false);
        }
    }, [user, product]);

    const handleAddToCartClick = (e) => {
        e.stopPropagation();
        addToCart(product);
    };

    const handleFavoriteClick = async (e) => {
        e.stopPropagation();

        if (!token) {
            showNotification('Debes iniciar sesión para añadir productos a tu lista de deseos.', 'warning');
            return;
        }

        // Optimistic UI: Cambiamos el corazón inmediatamente para que se sienta rápido
        const previousState = isFavorite;
        setIsFavorite(!isFavorite);

        const endpoint = `${API_BASE_URL}/wishlist/${product._id}`;
        const method = previousState ? 'DELETE' : 'POST';

        try {
            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                // Si falló, revertimos el cambio visual
                setIsFavorite(previousState);
                throw new Error(data.message || 'Error al actualizar la lista de deseos.');
            }

            showNotification(data.message, 'info');
            
            // Actualizamos el usuario global para que la wishlist se sincronice en otras páginas
            if (refreshUserData) {
                await refreshUserData();
            }

        } catch (error) {
            console.error('Error al actualizar la lista de deseos:', error);
            setIsFavorite(previousState); // Revertir en caso de error
            showNotification(`Error: ${error.message}`, 'error');
        }
    };

    const formatNumber = (num) => {
        if (typeof num !== 'number' || isNaN(num)) return '$0';
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    };

    return (
        <div className="product-card">
            <Link to={`/productos/${product._id}`} className="product-image-link">
                <img src={product.imageUrl || '/src/assets/images/placeholder.png'} alt={product.name} className="product-image" />
            </Link>
            
            <div className="product-info">
                {product.category && <span className="product-category">{product.category}</span>}
                
                <Link to={`/productos/${product._id}`} className="product-card-title-link">
                    <h3 className="product-card-title">{product.name}</h3>
                </Link>
                
                <p className="product-card-description">{product.description}</p>
                
                <p className="product-card-price">{formatNumber(product.price)}</p>
                
                <div className="product-actions">
                    <button className="btn-add-cart" onClick={handleAddToCartClick}>
                        <i className="fas fa-shopping-cart" aria-hidden="true"></i> Agregar
                    </button>
                    {/* Añadimos una clase condicional para pintar el corazón si es favorito */}
                    <button 
                        className={`btn-favorite ${isFavorite ? 'active' : ''}`} 
                        onClick={handleFavoriteClick}
                        title={isFavorite ? "Eliminar de favoritos" : "Añadir a favoritos"}
                    >
                        <i className={`${isFavorite ? 'fas' : 'far'} fa-heart`} aria-hidden="true"></i>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProductCard;