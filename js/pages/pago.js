// ======================================================
// LÓGICA ESPECÍFICA PARA LA PÁGINA DE PAGO
// ======================================================

document.addEventListener('DOMContentLoaded', function() {
    // Seleccionamos los elementos del DOM una sola vez
    const orderItemsContainer = document.getElementById("orderItems");
    const subtotalEl = document.getElementById("subtotal");
    const shippingEl = document.getElementById("shipping");
    const totalEl = document.getElementById("total");
    const submitPaymentBtn = document.getElementById('submitPayment');
    
    // Si no estamos en la página de pago, no hacemos nada.
    if (!orderItemsContainer) return;

    let orderTotal = 0; // Guardaremos el total final aquí para usarlo después

    /**
     * Renderiza el resumen del pedido en la página de pago.
     */
    function renderOrderSummary() {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        orderItemsContainer.innerHTML = "";
        let subtotal = 0;

        if (cart.length === 0) {
            // Si alguien llega a esta página con el carrito vacío, lo redirigimos.
            window.location.href = "carrito.html";
            return;
        }

        cart.forEach(product => {
            const productTotal = product.price * product.quantity;
            subtotal += productTotal;
            const item = document.createElement("div");
            item.classList.add("order-item");
            item.innerHTML = `
                <div class="order-item-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="order-item-info">
                    <h4>${product.name}</h4>
                    <p>${product.quantity} x $${formatNumber(product.price)}</p>
                </div>
                <div class="order-item-total">$${formatNumber(productTotal)}</div>
            `;
            orderItemsContainer.appendChild(item);
        });

        const shipping = calculateShipping(subtotal);
        orderTotal = subtotal + shipping; // Actualizamos la variable para usarla después

        subtotalEl.textContent = formatNumber(subtotal);
        shippingEl.textContent = formatNumber(shipping);
        totalEl.textContent = formatNumber(orderTotal);
    }

    /**
     * Calcula el costo de envío.
     * @param {number} subtotal - El subtotal de la compra.
     * @returns {number} - El costo del envío.
     */
    function calculateShipping(subtotal) {
        return subtotal > 100000 ? 0 : 10000;
    }

    /**
     * Simula la inicialización de una pasarela de pago.
     */
    function initializePaymentGateway() {
        console.log("Inicializando pasarela de pago...");
    }

    // --- MANEJO DE EVENTOS ---

    submitPaymentBtn.addEventListener('click', function() {
        // 1. Validar formulario de datos del cliente
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const address = document.getElementById('address').value;
        
        if (!name || !email || !address) {
            showNotification('Por favor, completa tus datos de envío.', 'error');
            return;
        }

        // 2. Simular procesamiento
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        this.disabled = true;

        // 3. Obtener el carrito actual para guardarlo en el resumen
        const cart = JSON.parse(localStorage.getItem("cart")) || [];

        // 4. ⭐ ¡CORRECCIÓN! Guardar la información FINAL del pedido, incluyendo los productos.
        const lastOrder = {
            orderNumber: Math.floor(100000 + Math.random() * 900000),
            total: orderTotal,
            products: cart, // <-- ¡ESTA LÍNEA ES LA CLAVE!
            customer: { name, email, address }
        };
        localStorage.setItem("lastOrder", JSON.stringify(lastOrder));
        
        // 5. Redirigir a la página de confirmación
        setTimeout(() => {
            window.location.href = 'confirmacion.html';
        }, 1500);
    });

    // --- INICIALIZACIÓN DE LA PÁGINA DE PAGO ---
    renderOrderSummary();
    initializePaymentGateway();
});