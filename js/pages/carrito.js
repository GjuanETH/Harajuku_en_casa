document.addEventListener('DOMContentLoaded', function() {
    const cartItemsContainer = document.getElementById("cartItems");
    const cartTotalEl = document.getElementById("cartTotal");
    const emptyCartEl = document.getElementById("emptyCart");

    if (!cartItemsContainer) return;

function renderCart() {
        // Siempre leemos la versión más fresca del carrito desde localStorage
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        cartItemsContainer.innerHTML = ""; 

        if (cart.length === 0) {
            if (emptyCartEl) emptyCartEl.style.display = 'flex';
            if (cartTotalEl) cartTotalEl.textContent = "0";
            updateCartVisuals(); 
            return;
        }

        if (emptyCartEl) emptyCartEl.style.display = 'none';
        let total = 0;

        cart.forEach((item, index) => {
            // ⭐ ¡AQUÍ ESTÁ LA CORRECCIÓN CLAVE! ⭐
            // La información del producto ahora está dentro de item.product
            const product = item.product; 
            
            // Verificación para evitar errores si el producto no se pobló bien
            if (!product) {
                console.error("Error: item del carrito no tiene producto poblado.", item);
                return; // Saltamos este item para no romper la página
            }

            const productTotal = product.price * item.quantity;
            total += productTotal;

            const itemDiv = document.createElement("div");
            itemDiv.className = "cart-item";
            itemDiv.dataset.index = index; 
            
            // Usamos las propiedades de 'product' para mostrar los datos
            itemDiv.innerHTML = `
                <div class="cart-item-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${product.name}</h4>
                    <p class="cart-item-price">$${formatNumber(product.price)} COP c/u</p>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn decrease-btn">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn increase-btn">+</button>
                    </div>
                </div>
                <div class="cart-item-total">
                    <p>$${formatNumber(productTotal)} COP</p>
                    <button class="remove-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            cartItemsContainer.appendChild(itemDiv);
        });

        if (cartTotalEl) cartTotalEl.textContent = formatNumber(total);
        updateCartVisuals();
    }

    renderCart();
});