// ==========================================
// LÓGICA GLOBAL - COMPARTIDA EN TODO EL SITIO
// ==========================================

const cartCount = document.getElementById("cartCount");

function formatNumber(number) {
    return new Intl.NumberFormat('es-CO').format(number);
}

function addToCart(productId) {
    let cart = JSON.parse(localStorage.getItem("cart")) || []; // Lee los datos más recientes
    const product = sampleProducts.find(p => p.id === productId);
    if (!product) return;

    const existingProductIndex = cart.findIndex(item => item.id === productId);
    if (existingProductIndex > -1) {
        cart[existingProductIndex].quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    localStorage.setItem("cart", JSON.stringify(cart)); // Guarda los cambios
    updateCartVisuals(); // Actualiza la UI
    showNotification(`¡"${product.name}" añadido al carrito!`);
}

function updateCartVisuals() {
    let cart = JSON.parse(localStorage.getItem("cart")) || []; // Siempre lee los datos más recientes
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
}

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

document.addEventListener('DOMContentLoaded', () => {
    updateCartVisuals();
});

window.addEventListener("storage", () => {
    updateCartVisuals();
});

document.addEventListener('DOMContentLoaded', () => {
    const userActions = document.getElementById('userActions');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userEmail = localStorage.getItem('userEmail'); // Obtenemos el email guardado

    // Función para actualizar el estado del UI del header
    const updateAuthUI = () => {
        if (userEmail) {
            // Usuario logueado: mostrar nombre y botón de logout
            loginBtn.innerHTML = `<i class="fas fa-user"></i> ${userEmail}`;
            loginBtn.href = "#"; // Opcional: podrías llevar a un perfil de usuario
            logoutBtn.style.display = 'inline-flex';
            // Asegurarse de que el botón de login sea visible si cambia de texto
            loginBtn.style.display = 'inline-flex'; 
        } else {
            // Usuario no logueado: mostrar botón de Iniciar Sesión
            loginBtn.innerHTML = `<i class="fas fa-user"></i> Iniciar Sesión`;
            loginBtn.href = "login.html";
            logoutBtn.style.display = 'none';
        }
    };

    // Escuchar el click en el botón de cerrar sesión
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (event) => {
            event.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('userEmail');
            alert('Sesión cerrada correctamente.');
            // Redirigir o simplemente actualizar la UI
            window.location.href = 'index.html'; // Redirige al inicio para limpiar el estado
        });
    }

    // Llamar a la función al cargar la página
    updateAuthUI();
});

function updateUserAuthState() {
    const token = localStorage.getItem('token');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const profileBtn = document.getElementById('profileBtn'); // <-- Buscamos el nuevo botón

    if (token) {
        // Usuario logueado
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        if (profileBtn) profileBtn.style.display = 'inline-flex'; // <-- Lo mostramos
    } else {
        // Usuario NO logueado
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        if (profileBtn) profileBtn.style.display = 'none'; // <-- Lo ocultamos
    }
}

/**
 * Cierra la sesión del usuario.
 */
function logout() {
    localStorage.removeItem('token');
    alert('Has cerrado la sesión.');
    updateUserAuthState();
}

// --- INICIALIZACIÓN GLOBAL ---
document.addEventListener('DOMContentLoaded', () => {
    // ... (tus funciones de carrito, etc.)
    updateUserAuthState();

    // Listener para el botón de cerrar sesión
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (event) => {
            event.preventDefault();
            logout();
        });
    }

    // --- ¡NUEVO! LISTENER PARA EL BOTÓN DE PERFIL ---
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                alert("Por favor, inicia sesión para ver tu perfil.");
                return;
            }

            try {
                const response = await fetch('http://localhost:3000/api/perfil', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        // ¡AQUÍ ENVIAMOS LA CREDENCIAL!
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    // Mostramos los datos que el backend nos devolvió
                    alert(`Perfil Secreto:\n\n${JSON.stringify(data.userData, null, 2)}`);
                } else {
                    // Si el token es inválido o expiró, el backend nos dará un error
                    alert("No se pudo acceder al perfil. Tu sesión puede haber expirado.");
                    logout(); // Opcional: cerramos la sesión si el token es inválido
                }
            } catch (error) {
                alert("Error al conectar con el servidor.");
            }
        });
    }
});