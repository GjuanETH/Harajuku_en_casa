// ==========================================
// LÓGICA GLOBAL - COMPARTIDA EN TODO EL SITIO (VERSIÓN CONSOLIDAD A Y ADAPTADA A TU HTML)
// ==========================================

// Elemento para el contador del carrito. Se inicializará en DOMContentLoaded.
let cartCountElement; // Definido aquí para que sea global en el script

function formatNumber(number) {
    return new Intl.NumberFormat('es-CL').format(number);
}

/**
 * Muestra una notificación en la parte superior derecha de la pantalla.
 * @param {string} message - El mensaje a mostrar.
 * @param {string} type - El tipo de notificación ('success', 'error', 'info').
 */
function showNotification(message, type = 'success') {
    const notificationContainer = document.getElementById('notification-container') || document.createElement('div');
    if (!document.getElementById('notification-container')) {
        notificationContainer.id = 'notification-container';
        document.body.appendChild(notificationContainer);
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle');
    notification.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    notificationContainer.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}


/**
 * Actualiza la visualización del contador de ítems del carrito en el header.
 */
function updateCartVisuals() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const totalItems = cart.reduce((sum, item) => {
        return sum + item.quantity;
    }, 0);
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
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
                localStorage.setItem('cart', JSON.stringify(updatedCart));
                updateCartVisuals();
                showNotification(`¡"${product.name}" añadido al carrito!`, 'success');
            } else {
                const errorData = await response.json();
                showNotification(errorData.message || 'Error al añadir el producto. Tu sesión puede haber expirado.', 'error');
                if (response.status === 401 || response.status === 403) {
                    logout();
                }
            }
        } catch (error) {
            console.error("Error al conectar con el endpoint de añadir al carrito:", error);
            showNotification('No se pudo conectar con el servidor.', 'error');
        }

    } else {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        const existingProductIndex = cart.findIndex(item => item._id === product._id);

        if (existingProductIndex > -1) {
            cart[existingProductIndex].quantity += 1;
        } else {
            product.quantity = 1;
            cart.push(product);
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartVisuals();
        showNotification(`¡"${product.name}" añadido al carrito!`, 'success');
    }
}

/**
 * Actualiza el estado visible de los botones de login/logout/perfil/admin en el header.
 * Se adapta a los IDs de tu HTML.
 */
function updateAuthDisplay() {
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail');
    const userRole = localStorage.getItem('userRole');

    // Referencias a tus IDs actuales en el HTML
    const loginBtn = document.getElementById('loginBtn'); // Tu botón de Iniciar Sesión (<a>)
    const registerLink = document.getElementById('registerLink'); // Tu enlace de Registrarse (<a>)
    const logoutBtn = document.getElementById('logoutBtn'); // Tu botón de Cerrar Sesión (<a>)
    const profileBtn = document.getElementById('profileBtn'); // Tu botón de Ver mi Perfil (<button>)
    
    // Estos deberían estar si quieres mostrar el email y el panel de admin
    const userEmailDisplay = document.getElementById('userEmailDisplay'); 
    const adminPanelLink = document.getElementById('adminPanelLink'); 
    
    // Ocultar todos los elementos de usuario/admin por defecto
    // Esto asegura un estado limpio antes de mostrar lo que corresponde
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerLink) registerLink.style.display = 'none'; 
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (profileBtn) profileBtn.style.display = 'none';
    if (userEmailDisplay) userEmailDisplay.style.display = 'none';
    if (adminPanelLink) adminPanelLink.style.display = 'none';


    if (token && userEmail) {
        // Usuario logueado: ocultar login/registro, mostrar logout/perfil/email
        if (logoutBtn) logoutBtn.style.display = 'inline-flex'; 
        if (profileBtn) profileBtn.style.display = 'inline-flex'; 

        if (userEmailDisplay) {
            userEmailDisplay.textContent = userEmail;
            userEmailDisplay.style.display = 'inline-block'; 
        }

        // Mostrar enlace de admin si el rol es 'admin'
        if (adminPanelLink && userRole === 'admin') {
            adminPanelLink.style.display = 'inline-flex'; 
        }

    } else {
        // Usuario NO logueado: mostrar Iniciar Sesión y Registrarse
        if (loginBtn) loginBtn.style.display = 'inline-flex'; 
        if (registerLink) registerLink.style.display = 'inline-flex'; 
    }
}

/**
 * Cierra la sesión del usuario, limpia el localStorage y actualiza la UI.
 */
function logout() {
    console.log("Cerrando sesión...");
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('cart');

    showNotification("Sesión cerrada correctamente.", "info");
    
    // Al cerrar sesión, queremos que la UI se actualice inmediatamente
    updateAuthDisplay();
    updateCartVisuals();

    // Redirigir siempre a index.html después de cerrar sesión
    if (window.location.pathname.includes('/index.html') || window.location.pathname === '/') {
        window.location.reload(); // Si ya estamos en index, recargar para asegurar el estado
    } else {
        window.location.href = 'index.html';
    }
}

// --- EVENT LISTENERS GLOBALES E INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar el elemento del contador del carrito
    cartCountElement = document.getElementById("cartCount");

    // Listener para el botón de cerrar sesión
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (event) => {
            event.preventDefault(); // Previene la navegación
            logout();
        });
    }

    // Listener para el botón de perfil (profileBtn)
    const profileBtn = document.getElementById('profileBtn'); // <-- Aseguramos que es 'profileBtn'
    if (profileBtn) {
        profileBtn.addEventListener('click', async (event) => {
            event.preventDefault(); // Previene la acción por defecto del botón
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
                    alert(`Datos del Perfil:\nEmail: ${data.userData.email}\nRol: ${data.userData.role}`);
                } else {
                    const errorData = await response.json();
                    showNotification(errorData.message || "No se pudo acceder al perfil. Tu sesión puede haber expirado.", "error");
                    if (response.status === 401 || response.status === 403) {
                        logout();
                    }
                }
            } catch (error) {
                showNotification("Error al conectar con el servidor para obtener el perfil.", "error");
            }
        });
    }

    updateCartVisuals(); // Actualiza el carrito visual al cargar
    updateAuthDisplay(); // Actualiza la UI de autenticación al cargar

});

// Escuchar cambios en localStorage desde otras pestañas/ventanas
window.addEventListener("storage", () => {
    updateCartVisuals();
    updateAuthDisplay();
});

// Hacer funciones globales si otros scripts las necesitan
window.addToCart = addToCart;
window.updateCartVisuals = updateCartVisuals;
window.showNotification = showNotification;
window.logout = logout;
window.updateAuthDisplay = updateAuthDisplay;