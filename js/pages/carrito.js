document.addEventListener('DOMContentLoaded', async function() {
    const cartItemsContainer = document.getElementById("cartItems");
    const cartTotalEl = document.getElementById("cartTotal");
    const emptyCartEl = document.getElementById("emptyCart");

    if (!cartItemsContainer) return;

    /**
     * Renderiza el carrito completo.
     * Obtiene los datos del backend si el usuario está logueado, o de localStorage si es invitado.
     */
    /**
 * Renderiza el carrito completo.
 * Obtiene los datos del backend si el usuario está logueado, o de localStorage si es invitado.
 */
async function renderCart() {
    console.log("\n--- INICIANDO RENDERIZADO DEL CARRITO ---");
    const token = localStorage.getItem('token');
    cartItemsContainer.innerHTML = "<p>Cargando carrito...</p>";
    let cart = [];

    if (token) {
        console.log("Detectado token. Intentando cargar carrito del backend...");
        try {
            const response = await fetch('http://localhost:3000/api/cart', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                cart = await response.json();
                console.log("Carrito cargado del backend:", JSON.stringify(cart, null, 2));
            } else {
                console.error("Error al cargar el carrito del backend. Estado:", response.status, response.statusText);
                // Si el token es inválido, limpiamos y recargamos
                localStorage.clear();
                window.location.reload();
            }
        } catch (error) {
            console.error("Error de red al cargar el carrito del backend:", error);
            // Si falla la red, intenta cargar de localStorage como fallback
            cart = JSON.parse(localStorage.getItem("cart")) || [];
            console.log("Cargando carrito de localStorage (fallback):", JSON.stringify(cart, null, 2));
        }
    } else {
        console.log("No se detectó token. Cargando carrito de localStorage...");
        cart = JSON.parse(localStorage.getItem("cart")) || [];
        console.log("Carrito cargado de localStorage:", JSON.stringify(cart, null, 2));
    }

    // Actualizamos el localStorage para que sea consistente con lo que se haya cargado
    localStorage.setItem('cart', JSON.stringify(cart));
    cartItemsContainer.innerHTML = ""; // Limpia el "Cargando..."

    if (cart.length === 0) {
        console.log("El carrito está vacío, mostrando mensaje.");
        if (emptyCartEl) emptyCartEl.style.display = 'flex';
        if (cartTotalEl) cartTotalEl.textContent = formatNumber(0);
        updateCartVisuals();
        return;
    }

    console.log("El carrito tiene elementos. Procediendo a renderizarlos.");
    if (emptyCartEl) emptyCartEl.style.display = 'none';
    let total = 0;

    cart.forEach((item, index) => {
        const product = item.product; 
        console.log(`Procesando item ${index}:`, JSON.stringify(item, null, 2));

        if (!product || !product.name || !product.price || !item.quantity) {
            console.error("Error: Item del carrito incompleto o mal formado, saltando.", item);
            return; // Salta este item para no romper la página
        }

        const productTotal = product.price * item.quantity;
        total += productTotal;

        const itemDiv = document.createElement("div");
        itemDiv.className = "cart-item";
        // Asegúrate de que los data-id para los botones estén correctos
        itemDiv.innerHTML = `
            <div class="cart-item-image"><img src="${product.image}" alt="${product.name}"></div>
            <div class="cart-item-details">
                <h4 class="cart-item-title">${product.name}</h4>
                <p class="cart-item-price">$${formatNumber(product.price)} COP c/u</p>
                <div class="cart-item-quantity">
                    <button class="quantity-btn decrease-btn" data-id="${product._id}">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn increase-btn" data-id="${product._id}">+</button>
                </div>
            </div>
            <div class="cart-item-total">
                <p>$${formatNumber(productTotal)} COP</p>
                <button class="remove-btn" data-id="${product._id}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        cartItemsContainer.appendChild(itemDiv);
    });

    console.log("Renderizado de items completado. Total:", total);
    if (cartTotalEl) cartTotalEl.textContent = formatNumber(total);
    updateCartVisuals();
    console.log("--- FIN DEL RENDERIZADO DEL CARRITO ---");
}

    /**
     * Maneja las actualizaciones de cantidad y eliminación, llamando al backend.
     */
    async function handleCartAction(productId, action) {
        const token = localStorage.getItem('token');
        if (!token) {
            // Lógica para invitados (aún no implementada aquí, se puede añadir si se desea)
            console.log("Acción de carrito para invitado.");
            return;
        }

        let url = '';
        let options = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        };

        if (action === 'remove') {
            url = `http://localhost:3000/api/cart/remove/${productId}`;
            options.method = 'DELETE';
        } else {
            let cart = JSON.parse(localStorage.getItem("cart")) || [];
            const item = cart.find(i => i.product._id === productId);
            if (!item) return;

            const newQuantity = (action === 'increase') ? item.quantity + 1 : item.quantity - 1;
            url = `http://localhost:3000/api/cart/update`;
            options.method = 'POST';
            options.body = JSON.stringify({ productId, quantity: newQuantity });
        }

        try {
            const response = await fetch(url, options);
            if (response.ok) {
                const updatedCart = await response.json();
                localStorage.setItem('cart', JSON.stringify(updatedCart));
                renderCart(); // Re-dibuja el carrito con la información del backend
            } else {
                showNotification('Error al actualizar el carrito.', 'error');
            }
        } catch (error) {
            console.error("Error de red al actualizar carrito:", error);
        }
    }

    // --- MANEJADOR DE EVENTOS CENTRALIZADO ---
    cartItemsContainer.addEventListener('click', (event) => {
        const target = event.target.closest('button');
        if (!target) return;

        const productId = target.dataset.id;
        if (!productId) return;

        if (target.classList.contains('increase-btn')) {
            handleCartAction(productId, 'increase');
        }
        if (target.classList.contains('decrease-btn')) {
            handleCartAction(productId, 'decrease');
        }
        if (target.classList.contains('remove-btn')) {
            handleCartAction(productId, 'remove');
        }
    });

    // --- INICIALIZACIÓN ---
    renderCart();
});