// js/pages/admin.js

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:3000/api'; // <--- ¡Confirma que este es el puerto de tu backend!

    // Referencias a los contenedores de listas de datos
    const productListDiv = document.getElementById('productList');
    const userListDiv = document.getElementById('userList');
    const orderListDiv = document.getElementById('orderList');

    // Referencias a los botones de las pestañas
    const adminTabButtons = document.querySelectorAll('.admin-nav ul li button'); // Selector más específico para los botones de pestaña
    
    // Referencias a los elementos del formulario de productos
    const addProductBtn = document.getElementById('addProductBtn');
    const productFormContainer = document.getElementById('productFormContainer');
    const productForm = document.getElementById('productForm');
    const cancelProductFormBtn = document.getElementById('cancelProductForm');

    // Mapeo de nombres de pestañas a sus elementos de contenido
    const tabContents = {
        products: document.getElementById('products-tab'),
        users: document.getElementById('users-tab'),
        orders: document.getElementById('orders-tab')
    };

    // Función auxiliar para formatear números a CLP (ej. $25.000)
    if (typeof formatNumber !== 'function') {
        window.formatNumber = (num) => new Intl.NumberFormat('es-CL', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num);
    }

    // Función para obtener el token JWT del localStorage
    function getAuthToken() {
        return localStorage.getItem('token');
    }

    // --- Función para mostrar la pestaña correcta y ocultar las demás ---
    function showTab(tabName) {
        // Remover clase 'active' de todos los botones de pestaña
        adminTabButtons.forEach(btn => btn.classList.remove('active'));
        // Remover clase 'active' de todos los contenidos de pestaña
        Object.values(tabContents).forEach(content => {
            if (content) content.classList.remove('active');
        });

        // Añadir clase 'active' al botón de la pestaña actual
        const activeBtn = document.querySelector(`.admin-nav ul li button[data-tab="${tabName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // Añadir clase 'active' al contenido de la pestaña actual
        const activeContent = tabContents[tabName];
        if (activeContent) {
            activeContent.classList.add('active');
        }
    }


    // --- Funciones de Carga de Datos (Productos, Usuarios, Pedidos) ---

    async function loadProducts() {
        productListDiv.innerHTML = '<p>Cargando productos...</p>';
        try {
            const response = await fetch(`${API_BASE_URL}/products`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const products = await response.json();
            // LOG DE DEPURACIÓN 1: Ver productos cargados del backend
            console.log('DEBUG: Productos cargados desde el backend:', products); 
            displayProducts(products);
        } catch (error) {
            console.error('Error al cargar productos:', error);
            productListDiv.innerHTML = '<p class="error-message">Error al cargar productos. Inténtalo de nuevo.</p>';
        }
    }

    function displayProducts(products) {
        if (!productListDiv) return;

        if (products.length === 0) {
            productListDiv.innerHTML = '<p class="no-data-message">No hay productos disponibles.</p>';
            return;
        }

        let tableHTML = `
            <div class="admin-table-container">
                <table class="admin-table">
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
        `;

        products.forEach(product => {
            // LOG DE DEPURACIÓN 2: Ver ID de cada producto al generar la tabla
            console.log(`DEBUG: Generando fila para producto: "${product.name}" con _id: "${product._id}"`); 
            tableHTML += `
                <tr>
                    <td><img src="${product.imageUrl}" alt="${product.name}" class="product-thumb"></td>
                    <td>${product.name}</td>
                    <td>${product.description}</td>
                    <td>$${formatNumber(product.price)}</td>
                    <td>${product.category}</td>
                    <td>${product.stock}</td>
                    <td class="actions">
                        <button class="btn-action edit-btn" data-id="${product._id}" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="btn-action delete-btn" data-id="${product._id}" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
                    </td>
                </tr>
            `;
        });

        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;
        productListDiv.innerHTML = tableHTML;
    }

    async function loadUsers() {
        console.log("Intentando cargar usuarios...");
        userListDiv.innerHTML = '<p>Cargando usuarios...</p>';
        const token = getAuthToken();
        if (!token) {
            userListDiv.innerHTML = '<p class="error-message">Necesitas iniciar sesión como administrador para ver usuarios.</p>';
            console.warn("loadUsers: Token no encontrado.");
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
                throw new Error(`Error al cargar usuarios: ${response.status} - ${errorData.message}`);
            }
            const users = await response.json();
            console.log('Usuarios obtenidos:', users);
            displayUsers(users);
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            userListDiv.innerHTML = `<p class="error-message">Error al cargar usuarios: ${error.message}</p>`;
        }
    }

    function displayUsers(users) {
        if (!userListDiv) return;

        if (users.length === 0) {
            userListDiv.innerHTML = '<p class="no-data-message">No hay usuarios registrados (aparte del admin).</p>';
            return;
        }

        let tableHTML = `
            <div class="admin-table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        users.forEach(user => {
            tableHTML += `
                <tr>
                    <td>${user._id}</td>
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                    <td class="actions">
                        <button class="btn-action edit-user-btn" data-id="${user._id}" title="Editar Rol"><i class="fas fa-user-edit"></i></button>
                        <button class="btn-action delete-user-btn" data-id="${user._id}" title="Eliminar Usuario"><i class="fas fa-trash-alt"></i></button>
                    </td>
                </tr>
            `;
        });

        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;
        userListDiv.innerHTML = tableHTML;
    }


    async function loadOrders() {
        console.log("Intentando cargar pedidos...");
        orderListDiv.innerHTML = '<p>Cargando pedidos...</p>';
        const token = getAuthToken();
        if (!token) {
            orderListDiv.innerHTML = '<p class="error-message">Necesitas iniciar sesión como administrador para ver pedidos.</p>';
            console.warn("loadOrders: Token no encontrado.");
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/orders`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
                throw new Error(`Error al cargar pedidos: ${response.status} - ${errorData.message}`);
            }
            const orders = await response.json();
            console.log('Pedidos obtenidos:', orders);
            displayOrders(orders);
        } catch (error) {
            console.error('Error al cargar pedidos:', error);
            orderListDiv.innerHTML = `<p class="error-message">Error al cargar pedidos: ${error.message}</p>`;
        }
    }

    function displayOrders(orders) {
        if (!orderListDiv) return;

        if (orders.length === 0) {
            orderListDiv.innerHTML = '<p class="no-data-message">No hay pedidos registrados.</p>';
            return;
        }

        let tableHTML = `
            <div class="admin-table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID Pedido</th>
                            <th>Email Usuario</th>
                            <th>Total</th>
                            <th>Estado</th>
                            <th>Fecha</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        orders.forEach(order => {
            const orderDate = new Date(order.createdAt).toLocaleDateString('es-CL');
            tableHTML += `
                <tr>
                    <td>${order._id}</td>
                    <td>${order.userEmail || order.user.email}</td> <td>$${formatNumber(order.totalAmount)}</td>
                    <td>${order.status}</td>
                    <td>${orderDate}</td>
                    <td class="actions">
                        <button class="btn-action view-order-btn" data-id="${order._id}" title="Ver Detalles"><i class="fas fa-eye"></i></button>
                        <button class="btn-action update-order-btn" data-id="${order._id}" title="Actualizar Estado"><i class="fas fa-sync-alt"></i></button>
                    </td>
                </tr>
            `;
        });

        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;
        orderListDiv.innerHTML = tableHTML;
    }


    // --- Lógica para manejo de acciones (Editar/Eliminar) ---

    async function handleEditProduct(productId) {
        // LOG DE DEPURACIÓN 3: Ver ID al intentar editar
        console.log(`DEBUG: handleEditProduct llamado con productId: "${productId}"`);

        const token = getAuthToken();
        if (!token) {
            alert('Necesitas iniciar sesión como administrador para editar productos.');
            productFormContainer.style.display = 'none';
            document.querySelector('#productForm .btn-save').textContent = 'Guardar Producto';
            document.getElementById('productId').value = '';
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}` 
                }
            });

            if (response.status === 401 || response.status === 403) {
                alert('No tienes permiso o tu sesión ha expirado. Por favor, inicia sesión como administrador.');
                localStorage.removeItem('token');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userRole');
                window.location.href = 'login.html'; 
                return; 
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
                throw new Error(`Error al obtener el producto: ${response.status} - ${errorData.message}`);
            }
            const product = await response.json();
            // LOG DE DEPURACIÓN 4: Ver producto obtenido para rellenar el formulario
            console.log('DEBUG: Producto obtenido para edición:', product);

            // Rellenar el formulario con los datos del producto
            document.getElementById('productId').value = product._id; // <--- Importante para la edición
            document.getElementById('productName').value = product.name;
            document.getElementById('productDescription').value = product.description;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productCategory').value = product.category;
            document.getElementById('productImage').value = product.imageUrl;
            document.getElementById('productStock').value = product.stock;

            // Mostrar el formulario y cambiar el texto del botón
            document.querySelector('#productForm .btn-save').textContent = 'Actualizar Producto';
            productFormContainer.style.display = 'block';

        } catch (error) {
            console.error('Error al cargar datos del producto para edición:', error);
            alert('Error al cargar los datos del producto para edición.');
            productFormContainer.style.display = 'none';
            document.querySelector('#productForm .btn-save').textContent = 'Guardar Producto';
            document.getElementById('productId').value = '';
        }
    }


    // --- DELEGACIÓN DE EVENTOS ---
    // Delegación para botones de acción de productos
    productListDiv.addEventListener('click', (event) => {
        const target = event.target;
        let button = target.closest('.edit-btn');
        if (button) {
            const productId = button.dataset.id;
            // LOG DE DEPURACIÓN 5: Ver ID extraído del botón de edición
            console.log(`DEBUG: Botón "Editar" clickeado. ID extraído del data-id: "${productId}"`);
            handleEditProduct(productId);
            return;
        }

        button = target.closest('.delete-btn');
        if (button) {
            const productId = button.dataset.id;
            // LOG DE DEPURACIÓN 6: Ver ID extraído del botón de eliminar
            console.log(`DEBUG: Botón "Eliminar" clickeado. ID extraído del data-id: "${productId}"`);
            handleDeleteProduct(productId);
            return;
        }
    });

    // Delegación para botones de acción de usuarios
    userListDiv.addEventListener('click', (event) => {
        const target = event.target;
        let button = target.closest('.edit-user-btn');
        if (button) {
            const userId = button.dataset.id;
            alert('Editar usuario con ID: ' + userId); // Implementar handleEditUser(userId)
            return;
        }
        button = target.closest('.delete-user-btn');
        if (button) {
            const userId = button.dataset.id;
            alert('Eliminar usuario con ID: ' + userId); // Implementar handleDeleteUser(userId)
            return;
        }
    });

    // Delegación para botones de acción de pedidos
    orderListDiv.addEventListener('click', (event) => {
        const target = event.target;
        let button = target.closest('.view-order-btn');
        if (button) {
            const orderId = button.dataset.id;
            alert('Ver detalles de pedido con ID: ' + orderId); // Implementar handleViewOrder(orderId)
            return;
        }
        button = target.closest('.update-order-btn');
        if (button) {
            const orderId = button.dataset.id;
            alert('Actualizar estado de pedido con ID: ' + orderId); // Implementar handleUpdateOrderStatus(orderId)
            return;
        }
    });


    // --- Event Listeners principales de la interfaz ---

    // Listener para los botones de las pestañas de administración
    adminTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            showTab(tabName); // Muestra la pestaña visualmente
            // Cargar los datos correspondientes a la pestaña activa
            if (tabName === 'products') {
                loadProducts();
            } else if (tabName === 'users') {
                loadUsers();
            } else if (tabName === 'orders') {
                loadOrders();
            }
        });
    });

    // Listener para el botón "Añadir Nuevo Producto"
    addProductBtn.addEventListener('click', () => {
        productForm.reset();
        document.getElementById('productId').value = ''; // Limpiar ID para nuevo producto
        productFormContainer.style.display = 'block';
    });

    // Listener para el botón "Cancelar" del formulario de productos
    cancelProductFormBtn.addEventListener('click', () => {
        productFormContainer.style.display = 'none';
    });


    // --- Lógica de envío del formulario de productos (Añadir/Editar) ---
    productForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const productId = document.getElementById('productId').value;
        const name = document.getElementById('productName').value;
        const description = document.getElementById('productDescription').value;
        const price = parseFloat(document.getElementById('productPrice').value);
        const category = document.getElementById('productCategory').value;
        const imageUrl = document.getElementById('productImage').value;
        const stock = parseInt(document.getElementById('productStock').value);

        if (!name || !description || isNaN(price) || price <= 0 || !category || !imageUrl || isNaN(stock) || stock < 0) {
            alert('Por favor, completa todos los campos correctamente. Precio y Stock deben ser números válidos.');
            return;
        }

        const productData = {
            name,
            description,
            price,
            category,
            imageUrl,
            stock
            // brand: (opcional) si lo quieres añadir en el formulario
        };

        const token = getAuthToken();
        if (!token) {
            alert('Necesitas iniciar sesión como administrador para añadir productos.');
            return;
        }

        try {
            let url = `${API_BASE_URL}/products`;
            let method = 'POST';

            // TODO: Lógica para edición (PUT) si productId está presente,
            // cambiar url y method si productId está presente
            if (productId) {
                // url = `${API_BASE_URL}/products/${productId}`;
                // method = 'PUT';
            }


            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(productData)
            });

            if (response.status === 401 || response.status === 403) {
                alert('No tienes permiso o tu sesión ha expirado. Por favor, inicia sesión como administrador.');
                localStorage.removeItem('token');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userRole');
                window.location.href = 'login.html';
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
                throw new Error(`Error al guardar el producto: ${response.status} - ${errorData.message}`);
            }

            alert('Producto guardado con éxito!');
            productForm.reset();
            productFormContainer.style.display = 'none';
            loadProducts(); // Recargar la lista para mostrar el nuevo/producto actualizado
        } catch (error) {
            console.error('Error al guardar el producto:', error);
            alert(`Hubo un error al guardar el producto: ${error.message}`);
        }
    });


    // --- Inicialización del panel de administración ---
    // Se ejecuta al cargar la página
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'admin') {
        loadProducts(); // Cargar productos al iniciar la página
        showTab('products'); // Mostrar la pestaña de productos por defecto
    } else {
        document.getElementById('main-content').innerHTML = '<p class="access-denied">Acceso denegado. Debes iniciar sesión como administrador para ver este panel.</p>';
        console.warn('Intento de acceso al panel de administración por usuario no-admin.');
    }
});