// ======================================================
// LÓGICA ESPECÍFICA PARA LA PÁGINA DEL CARRITO (VERSIÓN FINAL Y COMPLETA)
// ======================================================

document.addEventListener('DOMContentLoaded', async function() {
    const cartItemsContainer = document.getElementById("cartItems");
    const cartTotalEl = document.getElementById("cartTotal");
    const emptyCartEl = document.getElementById("emptyCart");

    if (!cartItemsContainer) return; // Si no estamos en la página del carrito, no hacemos nada

    /**
     * Renderiza el carrito completo, manejando tanto a usuarios logueados como a invitados.
     * Asegura que el formato del producto sea consistente.
     */
    async function renderCart() {
        console.log("\n--- INICIANDO RENDERIZADO DEL CARRITO ---");
        const token = localStorage.getItem('token');
        cartItemsContainer.innerHTML = "<p>Cargando carrito...</p>";
        let cart = []; // Este será nuestro carrito normalizado

        if (token) {
            // Usuario logueado: Obtener carrito del backend
            console.log("Detectado token. Intentando cargar carrito del backend...");
            try {
                const response = await fetch('http://localhost:3000/api/cart', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    cart = await response.json();
                    localStorage.setItem('cart', JSON.stringify(cart)); // Actualizar localStorage para consistencia
                    console.log("Carrito cargado del backend:", JSON.stringify(cart, null, 2));
                } else {
                    console.error("Error al cargar el carrito del backend. Estado:", response.status, response.statusText);
                    if (response.status === 401 || response.status === 403) {
                        logout(); // Llamar a la función logout global si el token es inválido
                        return;
                    }
                    // Fallback a localStorage si hay otro tipo de error del backend
                    cart = JSON.parse(localStorage.getItem("cart")) || [];
                    console.log("Cargando carrito de localStorage (fallback):", JSON.stringify(cart, null, 2));
                }
            } catch (error) {
                console.error("Error de red al cargar el carrito del backend:", error);
                // Fallback a localStorage si hay un error de red
                cart = JSON.parse(localStorage.getItem("cart")) || [];
                console.log("Cargando carrito de localStorage (fallback):", JSON.stringify(cart, null, 2));
            }
        } else {
            // Usuario invitado: Obtener carrito directamente de localStorage
            console.log("No se detectó token. Cargando carrito de localStorage...");
            cart = JSON.parse(localStorage.getItem("cart")) || [];
            // Aseguramos que tengan un _id y quantity para compatibilidad con el renderizado y acciones
            cart.forEach(item => {
                if (!item._id) item._id = item.id || Math.random().toString(36).substr(2, 9);
                if (typeof item.quantity === 'undefined') item.quantity = 1; // Asegurar cantidad por defecto
            });
            console.log("Carrito cargado de localStorage:", JSON.stringify(cart, null, 2));
        }

        cartItemsContainer.innerHTML = ""; // Limpia el "Cargando..."
        let total = 0;

        if (cart.length === 0) {
            console.log("El carrito está vacío, mostrando mensaje.");
            if (emptyCartEl) emptyCartEl.style.display = 'flex';
            if (cartTotalEl) cartTotalEl.textContent = formatNumber(0);
            updateCartVisuals();
            return;
        }

        console.log("El carrito tiene elementos. Procediendo a renderizarlos.");
        if (emptyCartEl) emptyCartEl.style.display = 'none';

        cart.forEach((item, index) => {
            const productToRender = item.product ? item.product : item;
            const quantityToRender = item.quantity;

            console.log(`Procesando item ${index}:`, JSON.stringify(item, null, 2));
            console.log(`Producto a renderizar:`, JSON.stringify(productToRender, null, 2));


            if (!productToRender || !productToRender.name || typeof productToRender.price !== 'number' || typeof quantityToRender !== 'number') {
                console.error("Error: Item del carrito incompleto o mal formado, saltando.", item);
                return;
            }

            const productTotal = productToRender.price * quantityToRender;
            total += productTotal;

            const itemDiv = document.createElement("div");
            itemDiv.className = "cart-item";
            itemDiv.innerHTML = `
                <div class="cart-item-image"><img src="${productToRender.imageUrl}" alt="${productToRender.name}"></div>
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${productToRender.name}</h4>
                    <p class="cart-item-price">$${formatNumber(productToRender.price)} COP c/u</p>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn decrease-btn" data-id="${productToRender._id}">-</button>
                        <span class="quantity">${quantityToRender}</span>
                        <button class="quantity-btn increase-btn" data-id="${productToRender._id}">+</button>
                    </div>
                </div>
                <div class="cart-item-total">
                    <p>$${formatNumber(productTotal)} COP</p>
                    <button class="remove-btn" data-id="${productToRender._id}"><i class="fas fa-trash"></i></button>
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
     * Maneja las actualizaciones de cantidad y eliminación para logueados y invitados.
     */
    async function handleCartAction(productId, action) {
        const token = localStorage.getItem('token');
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        let itemIndex = -1;

        // Búsqueda robusta del item, adaptándose a ambos formatos
        if (token) {
            itemIndex = cart.findIndex(item => item.product && item.product._id === productId);
        } else {
            // Para invitados, buscar directamente en item._id.
            // Si el localStorage está contaminado con el formato de logueado (item.product._id),
            // también intentar buscarlo así como fallback.
            itemIndex = cart.findIndex(item => item._id === productId);
            if (itemIndex === -1) { // Si no lo encuentra en formato de invitado, busca en formato de logueado
                itemIndex = cart.findIndex(item => item.product && item.product._id === productId);
            }
        }

        if (itemIndex === -1) {
            console.warn("Producto no encontrado en el carrito para la acción:", productId, action);
            return;
        }

        let currentItem = cart[itemIndex];
        let newQuantity;

        if (action === 'remove') {
            newQuantity = 0;
        } else if (action === 'increase') {
            newQuantity = currentItem.quantity + 1;
        } else if (action === 'decrease') {
            newQuantity = currentItem.quantity - 1;
        }

        if (token) {
            // --- Lógica para usuarios LOGUEADOS (llamada al backend) ---
            let url = '';
            let options = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            };

            if (newQuantity <= 0) {
                url = `http://localhost:3000/api/cart/remove/${productId}`;
                options.method = 'DELETE';
            } else {
                url = `http://localhost:3000/api/cart/update`;
                options.method = 'POST';
                options.body = JSON.stringify({ productId, quantity: newQuantity });
            }

            try {
                const response = await fetch(url, options);
                if (response.ok) {
                    const updatedCart = await response.json();
                    localStorage.setItem('cart', JSON.stringify(updatedCart));
                    renderCart();
                    updateCartVisuals();
                } else {
                    showNotification('Error al actualizar el carrito.', 'error');
                    console.error("Backend error updating cart:", await response.json());
                    if (response.status === 401 || response.status === 403) {
                        logout(); // Cerrar sesión si el token es inválido
                    }
                }
            } catch (error) {
                console.error("Error de red al actualizar carrito:", error);
                showNotification('No se pudo conectar con el servidor.', 'error');
            }
        } else {
            // --- Lógica para usuarios INVITADOS (solo localStorage) ---
            if (newQuantity <= 0) {
                cart.splice(itemIndex, 1); // Eliminar el producto
            } else {
                // Actualizar la cantidad en el item actual.
                // Si el item estaba en formato anidado (item.product), se mantiene así por ahora,
                // pero el renderizado ya lo normaliza.
                cart[itemIndex].quantity = newQuantity;
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            renderCart();
            updateCartVisuals();
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
        } else if (target.classList.contains('decrease-btn')) {
            handleCartAction(productId, 'decrease');
        } else if (target.classList.contains('remove-btn')) {
            handleCartAction(productId, 'remove');
        }
    });

    // --- INICIALIZACIÓN ---
    renderCart();
});