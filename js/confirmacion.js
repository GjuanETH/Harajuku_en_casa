// confirmacion.js
// ==========================
// Funciones para la página de confirmación
// ==========================

// Actualiza el contador del carrito en el header usando localStorage
function updateCartCount() {
    const cartCount = document.getElementById("cartCount");
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    if(cartCount) cartCount.textContent = cart.length;
}

// Generar número de orden aleatorio
function generateOrderNumber() {
    return Math.floor(100000 + Math.random() * 900000);
}

// Calcular fecha de entrega estimada (5-7 días hábiles)
function calculateDeliveryDate() {
    const today = new Date();
    const deliveryDate = new Date(today);
    // Agregar 5 días hábiles (excluyendo fines de semana)
    let daysToAdd = 5;
    while (daysToAdd > 0) {
        deliveryDate.setDate(deliveryDate.getDate() + 1);
        // Si no es sábado (6) ni domingo (0)
        if (deliveryDate.getDay() !== 0 && deliveryDate.getDay() !== 6) {
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

// Obtener el total del pedido desde localStorage
function getOrderTotal() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    let total = 0;
    
    console.log("Productos en el carrito:", cart); // Para depuración
    
    cart.forEach(product => {
        total += product.price * product.quantity;
    });
    
    // Calcular envío (gratis para compras superiores a $100.000)
    const shipping = total > 100000 ? 0 : 10000;
    const totalConEnvio = total + shipping;
    
    console.log("Subtotal:", total, "Envío:", shipping, "Total:", totalConEnvio); // Para depuración
    
    return totalConEnvio;
}

// Formatear números con separadores de miles
function formatNumber(number) {
    return new Intl.NumberFormat('es-CO').format(number);
}

// Inicializar la página
function initConfirmationPage() {
    console.log("Inicializando página de confirmación..."); // Para depuración
    
    //PRIMERO calcular el total ANTES de limpiar el carrito
    const orderTotal = getOrderTotal();
    
    // Establecer número de orden
    document.getElementById('orderNumber').textContent = generateOrderNumber();
    
    // Establecer fecha de entrega
    document.getElementById('deliveryDate').textContent = calculateDeliveryDate();
    
    // Establecer total del pedido (usando el valor calculado)
    document.getElementById('orderTotal').textContent = formatNumber(orderTotal);
    
    //LIMPIAR el carrito DESPUÉS de calcular el total
    localStorage.removeItem('cart');
    updateCartCount();
    
    console.log("Página de confirmación inicializada correctamente"); // Para depuración
}

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM cargado, inicializando..."); // Para depuración
    initConfirmationPage();
    updateCartCount();
});

// También actualizar el contador si la página ya está cargada
if (document.readyState === 'complete') {
    console.log("Página ya cargada, inicializando..."); // Para depuración
    initConfirmationPage();
    updateCartCount();
}