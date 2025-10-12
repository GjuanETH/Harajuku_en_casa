import React, { useState, useEffect } from 'react'; // <--- Importar useEffect
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../components/Notifications/NotificationSystem';
import { useAuth } from '../../context/AuthContext'; // <--- Importar useAuth
import './ProductCart.css';

function ProductCard({ product }) {
    const { addToCart } = useCart();
    const { showNotification } = useNotification();
    const { token, user, refreshUserData } = useAuth(); // <--- Obtener token, user y refreshUserData del contexto

    // Estado para controlar si el producto es favorito
    const [isFavorite, setIsFavorite] = useState(false);

    // Efecto para inicializar isFavorite cuando el usuario o el producto cambian
    useEffect(() => {
        if (user && user.wishlist && product && product._id) {
            // console.log("User wishlist:", user.wishlist);
            // console.log("Product ID:", product._id);
            setIsFavorite(user.wishlist.includes(product._id));
        } else {
            setIsFavorite(false); // No es favorito si no hay usuario o wishlist
        }
    }, [user, product]); // Depende de user (para la wishlist) y product (para su ID)

    const handleAddToCartClick = (e) => {
        e.stopPropagation();
        addToCart(product);
        showNotification(`${product.name} añadido al carrito.`, 'success');
    };

    const handleFavoriteClick = async (e) => { // <--- Hacer la función asíncrona
        e.stopPropagation();

        if (!token) {
            showNotification('Debes iniciar sesión para añadir productos a tu lista de deseos.', 'warning');
            return;
        }

        const API_BASE_URL = 'http://localhost:3000/api'; // Define la URL base aquí o impórtala de un archivo de config

        const endpoint = isFavorite
            ? `${API_BASE_URL}/wishlist/remove/${product._id}` // Ruta DELETE para eliminar
            : `${API_BASE_URL}/wishlist/add/${product._id}`;        // Ruta POST para añadir
        
        const method = isFavorite ? 'DELETE' : 'POST';

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
                throw new Error(data.message || 'Error al actualizar la lista de deseos.');
            }

            // Si la operación fue exitosa, actualizamos el estado local y notificamos
            setIsFavorite(!isFavorite);
            showNotification(data.message, 'info');
            
            // ¡IMPORTANTE! Refrescar los datos del usuario en el AuthContext
            refreshUserData();

        } catch (error) {
            console.error('Error al actualizar la lista de deseos:', error);
            showNotification(`Error al actualizar la lista de deseos: ${error.message}`, 'error');
        }
    };

    const formatNumber = (num) => {
        if (typeof num !== 'number' || isNaN(num)) return '$0';
        // Asegúrate de que el locale 'es-CO' y la currency 'COP' sean apropiados para ti
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
                    <button className={`btn-favorite ${isFavorite ? 'is-favorite' : ''}`} onClick={handleFavoriteClick}>
                        <i className="fas fa-heart" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProductCard; 