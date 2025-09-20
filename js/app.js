// ==========================================
// LÓGICA GLOBAL - COMPARTIDA EN TODO EL SITIO (VERSIÓN CONSOLIDADA)
// ==========================================

const cartCount = document.getElementById("cartCount");

function formatNumber(number) {
    return new Intl.NumberFormat('es-CO').format(number);
}

/**
 * Muestra una notificación en la parte superior derecha de la pantalla.
 * @param {string} message - El mensaje a mostrar.
 * @param {string} type - El tipo de notificación ('success', 'error', 'info').
 */
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `cart-notification ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    notification.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 500);
    }, 3000);
}

/**
 * Actualiza la visualización del contador de ítems del carrito en el header.
 */
function updateCartVisuals() {
    let cart = JSON.parse(localStorage.getItem("cart")) || []; // Siempre lee los datos más recientes
    const totalItems = cart.reduce((sum, item) => {
        // Asegurarse de contar la cantidad correctamente, independientemente del formato (invitado/logueado)
        return sum + item.quantity;
    }, 0);
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
}

/**
 * Añade un producto completo al carrito o incrementa su cantidad.
 * Se adapta si el usuario está logueado o es invitado.
 * @param {object} product - El objeto completo del producto a añadir.
 */
async function addToCart(product) {
    const token = localStorage.getItem('token');

    if (token) {
        // --- LÓGICA PARA USUARIO LOGUEADO ---
        try {
            const response = await fetch('http://localhost:3000/api/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId: product._id })
            });

            if (response.ok) {
                const updatedCart = await response.json();
                // Sincronizamos el localStorage con la respuesta autoritativa del backend
                localStorage.setItem('cart', JSON.stringify(updatedCart));
                updateCartVisuals();
                showNotification(`¡"${product.name}" añadido al carrito!`);
            } else {
                showNotification('Error al añadir el producto. Tu sesión puede haber expirado.', 'error');
                if (response.status === 401 || response.status === 403) { // Si el token es inválido
                    logout(); // Cierra sesión automáticamente
                }
            }
        } catch (error) {
            console.error("Error al conectar con el endpoint de añadir al carrito:", error);
            showNotification('No se pudo conectar con el servidor.', 'error');
        }

    } else {
        // --- LÓGICA PARA USUARIO INVITADO ---
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        // Para invitados, el item es el producto directamente
        const existingProductIndex = cart.findIndex(item => item._id === product._id);

        if (existingProductIndex > -1) {
            cart[existingProductIndex].quantity += 1;
        } else {
            product.quantity = 1;
            cart.push(product);
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartVisuals();
        showNotification(`¡"${product.name}" añadido al carrito!`);
    }
}


/**
 * Actualiza el estado visible de los botones de login/logout/perfil en el header.
 */
function updateAuthDisplay() {
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const profileBtn = document.getElementById('profileBtn');

    if (token && userEmail) {
        // Usuario logueado: ocultar loginBtn, mostrar logoutBtn y profileBtn
        if (loginBtn) {
            loginBtn.style.display = 'none'; // <-- CAMBIO CLAVE: Ocultar el botón de Login/Correo
        }
        if (logoutBtn) logoutBtn.style.display = 'inline-flex';
        if (profileBtn) profileBtn.style.display = 'inline-flex';
    } else {
        // Usuario NO logueado: mostrar botón de Iniciar Sesión, ocultar logoutBtn y profileBtn
        if (loginBtn) {
            loginBtn.innerHTML = `<i class="fas fa-user"></i> Iniciar Sesión`;
            loginBtn.href = "login.html";
            loginBtn.style.display = 'inline-flex'; // Asegurarse de que esté visible para no logueados
        }
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (profileBtn) profileBtn.style.display = 'none';
    }
}

/**
 * Cierra la sesión del usuario, limpia el localStorage y actualiza la UI.
 */
function logout() {
    console.log("Cerrando sesión...");
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('cart'); // ¡Asegúrate de limpiar el carrito al cerrar sesión!

    showNotification("Sesión cerrada correctamente.", "info");
    updateAuthDisplay();
    updateCartVisuals(); // Para resetear el contador a 0

    // Redirigir si no estamos ya en la página de inicio (para evitar bucles de renderizado si estamos en carrito.html)
    if (!window.location.pathname.includes('index.html') && !window.location.pathname.includes('login.html')) {
        window.location.href = 'index.html';
    } else if (window.location.pathname.includes('carrito.html')) {
        window.location.reload(); // Si estamos en el carrito, recargar para mostrarlo vacío
    }
}

// --- EVENT LISTENERS GLOBALES E INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    updateCartVisuals();
    updateAuthDisplay(); // Actualiza la UI de autenticación al cargar la página

    // Listener para el botón de cerrar sesión
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (event) => {
            event.preventDefault();
            logout();
        });
    }

    // Listener para el botón de perfil (si existe)
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                showNotification("Por favor, inicia sesión para ver tu perfil.", "info");
                return;
            }

            try {
                const response = await fetch('http://localhost:3000/api/perfil', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    showNotification(`Perfil:\n\n${JSON.stringify(data.userData, null, 2)}`, "success"); // Usar showNotification
                } else {
                    showNotification("No se pudo acceder al perfil. Tu sesión puede haber expirado.", "error");
                    if (response.status === 401 || response.status === 403) {
                        logout(); // Cerrar sesión si el token es inválido
                    }
                }
            } catch (error) {
                showNotification("Error al conectar con el servidor.", "error");
            }
        });
    }
});

// Escuchar cambios en localStorage desde otras pestañas/ventanas
window.addEventListener("storage", () => {
    updateCartVisuals();
    updateAuthDisplay();
});