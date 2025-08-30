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