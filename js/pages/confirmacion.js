// ======================================================
// LÓGICA ESPECÍFICA PARA LA PÁGINA DE CONFIRMACIÓN DE COMPRA
// ======================================================

document.addEventListener('DOMContentLoaded', function() {
    // Seleccionamos los elementos del DOM que necesitamos
    // Seleccionamos los elementos del DOM que necesitamos
    const orderNumberEl = document.getElementById('orderNumber');
    const deliveryDateEl = document.getElementById('deliveryDate');
    const orderTotalEl = document.getElementById('orderTotal');
    const orderDetailsList = document.getElementById('orderDetailsList'); // <-- Nuevo elemento

    // Si no estamos en la página de confirmación, no hacemos nada.
    if (!orderNumberEl || !deliveryDateEl || !orderTotalEl) {
        console.warn("No se encontraron los elementos de la página de confirmación. Asegúrate de estar en confirmacion.html");
        return;
    }

    /**
     * Genera un número de orden aleatorio.
     * @returns {number} Un número de 6 dígitos.
     */
    function generateOrderNumber() {
        return Math.floor(100000 + Math.random() * 900000);
    }

    /**
     * Calcula una fecha de entrega estimada (5 días hábiles a partir de hoy).
     * @returns {string} La fecha formateada en español.
     */
    function calculateDeliveryDate() {
        const deliveryDate = new Date();
        let daysToAdd = 5;
        while (daysToAdd > 0) {
            deliveryDate.setDate(deliveryDate.getDate() + 1);
            const dayOfWeek = deliveryDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Excluye Sábado (6) y Domingo (0)
                daysToAdd--;
            }
        }
        return deliveryDate.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Recupera la información guardada del último pedido desde localStorage.
     */
    function displayOrderSummary() {
        // Obtenemos los datos del pedido que guardamos en la página de pago
        const lastOrder = JSON.parse(localStorage.getItem("lastOrder"));

        if (lastOrder) {
            orderNumberEl.textContent = lastOrder.orderNumber;
            orderTotalEl.textContent = formatNumber(lastOrder.total); // Usa la función global
        } else {
            // Si no hay datos, mostramos valores por defecto para que no se vea roto
            orderNumberEl.textContent = generateOrderNumber();
            orderTotalEl.textContent = "0";
            console.error("No se encontró información del último pedido en localStorage.");
        }

        deliveryDateEl.textContent = calculateDeliveryDate();

        // Limpiamos el carrito de compras actual para futuras compras
        localStorage.removeItem('cart');
        
        // Actualizamos el contador del header a 0 usando la función global
        cart = []; // Reseteamos la variable global
        updateCart(); 
    }

    // --- INICIALIZACIÓN DE LA PÁGINA DE CONFIRMACIÓN ---
    displayOrderSummary();
});