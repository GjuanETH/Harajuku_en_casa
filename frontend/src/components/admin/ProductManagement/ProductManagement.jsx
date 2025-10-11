// src/components/Admin/ProductManagement/ProductManagement.jsx
import React, { useState, useEffect } from 'react';
import './ProductManagement.css';

// --- ELIMINADAS LAS IMPORTACIONES DE FONT AWESOME ---
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faPlusCircle, faEdit, faTrashAlt, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';

// Función auxiliar para formatear números a CLP (ej. $25.000)
const formatNumber = (num) => {
    if (typeof num !== 'number') return num;
    return new Intl.NumberFormat('es-CL', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num);
};

// Función para obtener el token JWT del localStorage (adaptada para React)
const getAuthToken = () => {
    return localStorage.getItem('token');
};

const API_BASE_URL = 'http://localhost:3000/api'; // Confirma que este es el puerto de tu backend

const ProductManagement = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null); // Para editar: null si es nuevo, objeto de producto si se edita

    // Estado para los campos del formulario
    const [formData, setFormData] = useState({
        _id: '',
        name: '',
        description: '',
        price: '',
        category: '',
        imageUrl: '',
        stock: ''
    });

    // Función para cargar productos
    const loadProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/products`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setProducts(data);
        } catch (err) {
            console.error('Error al cargar productos:', err);
            setError('Error al cargar productos. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    // useEffect para cargar productos al montar el componente
    useEffect(() => {
        loadProducts();
    }, []);

    // Manejar cambios en el formulario
    const handleFormChange = (e) => {
        const { id, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [id]: value
        }));
    };

    // Mostrar formulario para añadir un nuevo producto
    const handleAddProductClick = () => {
        setCurrentProduct(null); // Indicar que es un producto nuevo
        setFormData({ // Limpiar formulario
            _id: '',
            name: '',
            description: '',
            price: '',
            category: '',
            imageUrl: '',
            stock: ''
        });
        setShowForm(true);
    };

    // Mostrar formulario para editar un producto existente
    const handleEditProductClick = async (productId) => {
        const productToEdit = products.find(p => p._id === productId);
        if (!productToEdit) {
            setError('Producto no encontrado para editar.');
            return;
        }

        setCurrentProduct(productToEdit);
        setFormData({
            _id: productToEdit._id,
            name: productToEdit.name,
            description: productToEdit.description,
            price: productToEdit.price,
            category: productToEdit.category,
            imageUrl: productToEdit.imageUrl,
            stock: productToEdit.stock
        });
        setShowForm(true);
    };

    // Manejar el envío del formulario (Crear o Actualizar)
    const handleFormSubmit = async (e) => {
        e.preventDefault();

        const token = getAuthToken();
        if (!token) {
            alert('Necesitas iniciar sesión como administrador para añadir/editar productos.');
            return;
        }

        // Validaciones básicas
        if (!formData.name || !formData.description || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0 || !formData.category || !formData.imageUrl || isNaN(parseInt(formData.stock)) || parseInt(formData.stock) < 0) {
            alert('Por favor, completa todos los campos correctamente. Precio y Stock deben ser números válidos.');
            return;
        }

        let url = `${API_BASE_URL}/products`;
        let method = 'POST';
        let successMessage = 'Producto añadido exitosamente.';

        if (currentProduct) {
            url = `${API_BASE_URL}/products/${currentProduct._id}`;
            method = 'PUT';
            successMessage = 'Producto actualizado exitosamente.';
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    price: parseFloat(formData.price),
                    category: formData.category,
                    imageUrl: formData.imageUrl,
                    stock: parseInt(formData.stock)
                })
            });

            if (response.status === 401 || response.status === 403) {
                alert('No tienes permiso o tu sesión ha expirado. Por favor, inicia sesión como administrador.');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Error desconocido del servidor' }));
                throw new Error(`Error al guardar el producto: ${response.status} - ${errorData.message}`);
            }

            alert(successMessage);
            setShowForm(false);
            loadProducts();
        } catch (err) {
            console.error('Error al guardar el producto:', err);
            alert(`Hubo un error al guardar el producto: ${err.message}`);
        }
    };

    // Manejar eliminación de producto
    const handleDeleteProductClick = async (productId) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.')) {
            return;
        }

        const token = getAuthToken();
        if (!token) {
            alert('Necesitas iniciar sesión como administrador para eliminar productos.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401 || response.status === 403) {
                alert('No tienes permiso o tu sesión ha expirado. Por favor, inicia sesión como administrador.');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Error desconocido del servidor' }));
                throw new Error(`Error al eliminar el producto: ${response.status} - ${errorData.message}`);
            }

            alert('Producto eliminado exitosamente.');
            loadProducts();
        } catch (err) {
            console.error('Error al eliminar producto:', err);
            alert(`Error al eliminar el producto: ${err.message}`);
        }
    };


    // Renderizado del componente
    return (
        <section id="products-tab" className="admin-tab-content active">
            <h3>Gestión de Productos</h3> {/* Icono faPlusCircle eliminado */}
            <button className="btn-add" onClick={handleAddProductClick}>
                {/* Icono faPlusCircle eliminado */}
                Añadir Nuevo Producto
            </button>

            {showForm && (
                <div id="productFormContainer" className="form-container">
                    <h4>{currentProduct ? 'Editar Producto' : 'Añadir Nuevo Producto'}</h4>
                    <form id="productForm" onSubmit={handleFormSubmit}>
                        <input type="hidden" id="productId" value={formData._id} />
                        <label htmlFor="name">Nombre:</label>
                        <input type="text" id="name" value={formData.name} onChange={handleFormChange} required />

                        <label htmlFor="description">Descripción:</label>
                        <textarea id="description" value={formData.description} onChange={handleFormChange} required></textarea>

                        <label htmlFor="price">Precio:</label>
                        <input type="number" id="price" step="0.01" value={formData.price} onChange={handleFormChange} required />

                        <label htmlFor="category">Categoría:</label>
                        <input type="text" id="category" value={formData.category} onChange={handleFormChange} required />

                        <label htmlFor="imageUrl">URL Imagen:</label>
                        <input type="text" id="imageUrl" value={formData.imageUrl} onChange={handleFormChange} required />

                        <label htmlFor="stock">Stock:</label>
                        <input type="number" id="stock" value={formData.stock} onChange={handleFormChange} required />

                        <button type="submit" className="btn-save">
                            {/* Icono faSave eliminado */}
                            {currentProduct ? 'Actualizar Producto' : 'Guardar Producto'}
                        </button>
                        <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>
                            {/* Icono faTimes eliminado */}
                            Cancelar
                        </button>
                    </form>
                </div>
            )}

            <div id="productList" className="admin-table-container">
                {loading && <p>Cargando productos...</p>}
                {error && <p className="error-message">{error}</p>}
                {!loading && !error && products.length === 0 && (
                    <p className="no-data-message">No hay productos disponibles.</p>
                )}
                {!loading && !error && products.length > 0 && (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Imagen</th>
                                <th>Nombre</th>
                                <th>Descripción</th>
                                <th>Precio</th>
                                <th>Categoría</th>
                                <th>Stock</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => (
                                <tr key={product._id}>
                                    <td><img src={product.imageUrl} alt={product.name} className="product-thumb" /></td>
                                    <td>{product.name}</td>
                                    <td>{product.description}</td>
                                    <td>${formatNumber(product.price)}</td>
                                    <td>{product.category}</td>
                                    <td>{product.stock}</td>
                                    <td className="actions">
                                        <button className="btn-action edit-btn" onClick={() => handleEditProductClick(product._id)} title="Editar">
                                            {/* Icono faEdit eliminado */}
                                            Editar
                                        </button>
                                        <button className="btn-action delete-btn" onClick={() => handleDeleteProductClick(product._id)} title="Eliminar">
                                            {/* Icono faTrashAlt eliminado */}
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </section>
    );
};

export default ProductManagement;