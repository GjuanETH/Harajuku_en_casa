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