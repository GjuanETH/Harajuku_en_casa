import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserProfile.css';
import { useAuth } from '../../context/AuthContext';

const UserProfile = () => {
    const { token, logout } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    const [editedName, setEditedName] = useState('');
    const [editedBio, setEditedBio] = useState('');
    const [editedLocation, setEditedLocation] = useState('');
    const [editedStylePreferences, setEditedStylePreferences] = useState('');
    const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('https://i.ibb.co/Vt2L0Qh/yuki-tanaka-avatar.png');
    const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        fetchProfileData();
    }, [token, navigate]);

    useEffect(() => {
        if (profileData) {
            setEditedName(profileData.profile?.name || '');
            setEditedBio(profileData.profile?.bio || '');
            setEditedLocation(profileData.profile?.location || '');
            setEditedStylePreferences(profileData.profile?.stylePreferences?.join(', ') || '');
            setAvatarPreviewUrl(profileData.profile?.avatar || 'https://i.ibb.co/Vt2L0Qh/yuki-tanaka-avatar.png');
        }
    }, [profileData]);

    const fetchProfileData = async () => {
        setLoading(true);
        setError(null);
        try {
            const profileResponse = await fetch(`http://localhost:3000/api/perfil`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (profileResponse.status === 401) {
                logout();
                navigate('/login');
                return;
            }

            if (!profileResponse.ok) {
                const errData = await profileResponse.json();
                throw new Error(errData.message || 'Error al cargar el perfil.');
            }

            const profileDataFetched = await profileResponse.json();

            const ordersResponse = await fetch(`http://localhost:3000/api/orders/user`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            let processedOrders = [];
            if (!ordersResponse.ok) {
                const errData = await ordersResponse.json();
                console.warn('Error al cargar los pedidos del usuario:', errData.message || 'Error desconocido');
            } else {
                const rawOrders = await ordersResponse.json();
                const uniqueOrderMap = new Map();
                rawOrders.forEach(order => {
                    if (!uniqueOrderMap.has(order._id)) {
                        uniqueOrderMap.set(order._id, order);
                    }
                });
                processedOrders = Array.from(uniqueOrderMap.values());
            }

            const wishlistResponse = await fetch(`http://localhost:3000/api/wishlist`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            let userWishlist = [];
            if (!wishlistResponse.ok) {
                const errData = await wishlistResponse.json();
                console.warn('Error al cargar la lista de deseos:', errData.message || 'Error desconocido');
            } else {
                userWishlist = await wishlistResponse.json();
            }

            setProfileData({
                ...profileDataFetched.userData,
                userOrders: processedOrders,
                wishlist: userWishlist,
                ordersCount: processedOrders.length, // Usa la longitud de los pedidos filtrados
                favoritesCount: userWishlist.length
            });

        } catch (err) {
            console.error('Error fetching profile data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditToggle = () => {
        setIsEditingProfile(!isEditingProfile);
        if (isEditingProfile) {
            setEditedName(profileData.profile?.name || '');
            setEditedBio(profileData.profile?.bio || '');
            setEditedLocation(profileData.profile?.location || '');
            setEditedStylePreferences(profileData.profile?.stylePreferences?.join(', ') || '');
            setAvatarPreviewUrl(profileData.profile?.avatar || 'https://i.ibb.co/Vt2L0Qh/yuki-tanaka-avatar.png');
            setSelectedAvatarFile(null);
        }
    };

    const handleAvatarFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedAvatarFile(file);
            setAvatarPreviewUrl(URL.createObjectURL(file));
        }
    };

    const uploadAvatar = async (file) => {
        if (!file) return null;

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await fetch('http://localhost:3000/api/upload-avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al subir el avatar.');
            }

            const data = await response.json();
            return data.avatarUrl;
        } catch (error) {
            console.error('Error uploading avatar:', error);
            setError('Error al subir el avatar.');
            return null;
        }
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            let newAvatarUrl = profileData.profile?.avatar;
            if (selectedAvatarFile) {
                newAvatarUrl = await uploadAvatar(selectedAvatarFile);
                if (!newAvatarUrl) {
                    setLoading(false);
                    return;
                }
            }

            const updatedProfile = {
                name: editedName,
                bio: editedBio,
                location: editedLocation,
                stylePreferences: editedStylePreferences.split(',').map(s => s.trim()).filter(s => s),
                avatar: newAvatarUrl,
            };

            const response = await fetch(`http://localhost:3000/api/perfil`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedProfile),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al guardar los cambios.');
            }

            await fetchProfileData();
            setIsEditingProfile(false);
            setSelectedAvatarFile(null);
        } catch (err) {
            console.error('Error saving profile:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFromWishlist = async (productId) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este producto de tu lista de deseos?')) {
            return;
        }
        try {
            const response = await fetch(`http://localhost:3000/api/wishlist/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar de la lista de deseos.');
            }
            await fetchProfileData();
        } catch (err) {
            console.error('Error removing from wishlist:', err);
            setError(err.message);
        }
    };

    // NUEVA FUNCIÓN: Manejar la cancelación de pedidos
    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('¿Estás seguro de que quieres cancelar este pedido? Esta acción no se puede deshacer.')) {
            return;
        }
        setLoading(true); // Mostrar loading mientras se cancela
        setError(null);
        try {
            const response = await fetch(`http://localhost:3000/api/orders/${orderId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al cancelar el pedido.');
            }

            alert('Pedido cancelado exitosamente.');
            await fetchProfileData(); // Recargar los datos del perfil para reflejar el cambio de estado del pedido
        } catch (err) {
            console.error('Error cancelling order:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    if (loading) {
        return <div className="profile-page-harajuku"><p className="container">Cargando perfil...</p></div>;
    }

    if (error) {
        return <div className="profile-page-harajuku"><p className="container error-message">Error: {error}</p></div>;
    }

    if (!profileData) {
        return <div className="profile-page-harajuku"><p className="container">No se pudo cargar la información del perfil.</p></div>;
    }

    return (
        <div className="profile-page-harajuku">
            <div className="kawaii-element" style={{ top: '5%', left: '5%' }}>💖</div>
            <div className="kawaii-element" style={{ bottom: '10%', right: '8%' }}>✨</div>

            <div className="container">
                <div className="profile-grid">
                    <div className="profile-sidebar">
                        <div className="profile-card profile-info">
                            <div className="profile-avatar-wrapper">
                                <img
                                    src={avatarPreviewUrl}
                                    alt={profileData.profile?.name || 'Usuario'}
                                    className="profile-avatar"
                                />
                            </div>

                            {isEditingProfile && (
                                <>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        accept="image/*"
                                        onChange={handleAvatarFileChange}
                                    />
                                    <button
                                        className="btn-profile-upload-avatar"
                                        onClick={() => fileInputRef.current.click()}
                                    >
                                        <i className="fas fa-camera"></i> Cambiar Avatar
                                    </button>
                                </>
                            )}

                            {isEditingProfile ? (
                                <div className="profile-edit-form">
                                    <input
                                        type="text"
                                        className="profile-input"
                                        value={editedName}
                                        onChange={(e) => setEditedName(e.target.value)}
                                        placeholder="Tu nombre"
                                    />
                                    <textarea
                                        className="profile-textarea"
                                        value={editedBio}
                                        onChange={(e) => setEditedBio(e.target.value)}
                                        placeholder="Tu biografía"
                                    ></textarea>
                                    <input
                                        type="text"
                                        className="profile-input"
                                        value={editedLocation}
                                        onChange={(e) => setEditedLocation(e.target.value)}
                                        placeholder="Tu ubicación"
                                    />
                                    <input
                                        type="text"
                                        className="profile-input"
                                        value={editedStylePreferences}
                                        onChange={(e) => setEditedStylePreferences(e.target.value)}
                                        placeholder="Estilos (separados por comas)"
                                    />
                                    <div className="profile-actions">
                                        <button className="btn-profile follow" onClick={handleSaveProfile}>Guardar</button>
                                        <button className="btn-profile" onClick={handleEditToggle}>Cancelar</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h2 className="profile-name">{profileData.profile?.name || 'Usuario Harajuku'}</h2>
                                    <p className="profile-bio">{profileData.profile?.bio || 'Amante de la moda japonesa.'}</p>
                                    <p className="profile-location">
                                        <i className="fas fa-map-marker-alt"></i> {profileData.profile?.location || 'Un lugar kawaii'}
                                    </p>
                                    <div className="profile-actions">
                                        <button className="btn-profile follow" onClick={handleEditToggle}>
                                            <i className="fas fa-edit"></i> Editar Perfil
                                        </button>
                                        <button className="btn-profile share">
                                            <i className="fas fa-share-alt"></i> Compartir
                                        </button>
                                    </div>
                                </>
                            )}
                            <div className="profile-stats">
                                <div className="stat-item">
                                    <span className="stat-number">{profileData.ordersCount ?? 0}</span>
                                    <span className="stat-label">Pedidos</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">{profileData.favoritesCount ?? 0}</span>
                                    <span className="stat-label">Favoritos</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">5.0</span>
                                    <span className="stat-label">Rating</span>
                                </div>
                            </div>
                        </div>

                        <div className="profile-card style-preferences">
                            <h3>Tus Preferencias de Estilo</h3>
                            <div className="style-tags">
                                {profileData.profile?.stylePreferences && profileData.profile.stylePreferences.length > 0 ? (
                                    profileData.profile.stylePreferences.map((tag, index) => (
                                        <span key={index} className="style-tag">{tag}</span>
                                    ))
                                ) : (
                                    <p className="empty-message">No tienes preferencias de estilo añadidas. ¡Edita tu perfil para agregarlas!</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="profile-main-content">
                        <div className="user-product-list profile-card">
                            <h3>Tus Últimos Pedidos</h3>
                            {profileData.userOrders && profileData.userOrders.length > 0 ? (
                                profileData.userOrders
                                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                    .slice(0, 3)
                                    .map(order => (
                                        <div key={order._id} className="order-item-card">
                                            <p className="order-card-header">
                                                <strong>Pedido #{order.orderNumber || order._id.slice(-6).toUpperCase()}</strong>
                                                <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                                            </p>
                                            <div className="order-items-summary">
                                                {order.items.map(item => (
                                                    <div key={`${order._id}-${item.productId}`} className="product-item-small">
                                                        <img src={item.imageUrl} alt={item.productName} className="product-thumb" />
                                                        <div className="product-details-small">
                                                            <span className="product-name-small">{item.productName}</span>
                                                            <span className="product-size-small">Cantidad: {item.quantity}</span>
                                                        </div>
                                                        <span className="product-price-small">${item.price.toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="order-card-footer">
                                                <span className={`product-status ${order.status === 'delivered' ? 'entregado' : (order.status === 'cancelled' ? 'cancelado' : 'pendiente')}`}>
                                                    {order.status === 'delivered' ? 'Entregado' : (order.status === 'cancelled' ? 'Cancelado' : 'Pendiente')}
                                                </span>
                                                <strong>Total: ${order.total.toFixed(2)}</strong>
                                                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                                    <button 
                                                        className="btn-cancel-order" 
                                                        onClick={() => handleCancelOrder(order._id)}
                                                    >
                                                        Cancelar
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                <p className="empty-message">No tienes pedidos recientes.</p>
                            )}
                        </div>

                        <div className="wishlist-section">
                            <div className="section-header">
                                <h3>Tu Lista de Deseos</h3>
                            </div>
                            <div className="wishlist-grid">
                                {profileData.wishlist && profileData.wishlist.length > 0 ? (
                                    profileData.wishlist.map(product => (
                                        <div key={product._id} className="wishlist-item">
                                            <button
                                                className="btn-favorite-small"
                                                onClick={() => handleRemoveFromWishlist(product._id)}
                                                style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 2, color: 'var(--primary-pink)' }}
                                            >
                                                <i className="fas fa-heart"></i>
                                            </button>
                                            <img src={product.imageUrl} alt={product.name} className="wishlist-item-image" />
                                            <div className="wishlist-item-info">
                                                <span className="wishlist-item-name">{product.name}</span>
                                                <span className="wishlist-item-price">${product.price.toFixed(2)}</span>
                                                <div className="wishlist-item-rating">
                                                    <i className="fas fa-star"></i>
                                                    <i className="fas fa-star"></i>
                                                    <i className="fas fa-star"></i>
                                                    <i className="fas fa-star"></i>
                                                    <i className="fas fa-star-half-alt"></i>
                                                    <span>(4.5)</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="empty-wishlist-message">¡Tu lista de deseos está vacía! Explora nuestros productos y añade tus favoritos.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;