document.addEventListener('DOMContentLoaded', function() {
    const cartItemsContainer = document.getElementById("cartItems");
    const cartTotalEl = document.getElementById("cartTotal");
    const emptyCartEl = document.getElementById("emptyCart");

    if (!cartItemsContainer) return;

    function renderCart() {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        cartItemsContainer.innerHTML = "";

        if (cart.length === 0) {
            if (emptyCartEl) emptyCartEl.style.display = 'flex';
            if (cartTotalEl) cartTotalEl.textContent = "0";
            updateCartVisuals();
            return;
        }

        if (emptyCartEl) emptyCartEl.style.display = 'none';
        let total = 0;

        cart.forEach((product, index) => {
            const productTotal = product.price * product.quantity;
            total += productTotal;
            const item = document.createElement("div");
            item.className = "cart-item";
            item.dataset.index = index;
            item.innerHTML = `
                <div class="cart-item-image"><img src="${product.image}" alt="${product.name}"></div>
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${product.name}</h4>
                    <p class="cart-item-price">$${formatNumber(product.price)} COP c/u</p>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn decrease-btn">-</button>
                        <span class="quantity">${product.quantity}</span>
                        <button class="quantity-btn increase-btn">+</button>
                    </div>
                </div>
                <div class="cart-item-total">
                    <p>$${formatNumber(productTotal)} COP</p>
                    <button class="remove-btn"><i class="fas fa-trash"></i></button>
                </div>
            `;
            cartItemsContainer.appendChild(item);
        });

        if (cartTotalEl) cartTotalEl.textContent = formatNumber(total);
        updateCartVisuals();
    }

    cartItemsContainer.addEventListener('click', (event) => {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        const itemDiv = event.target.closest('.cart-item');
        if (!itemDiv) return;
        const index = Number(itemDiv.dataset.index);

        if (event.target.closest('.remove-btn')) {
            const removed = cart.splice(index, 1);
            localStorage.setItem("cart", JSON.stringify(cart));
            renderCart();
            showNotification(`"${removed[0].name}" eliminado.`, 'error');
        }

        if (event.target.closest('.increase-btn')) {
            cart[index].quantity++;
            localStorage.setItem("cart", JSON.stringify(cart));
            renderCart();
        }

        if (event.target.closest('.decrease-btn')) {
            cart[index].quantity--;
            if (cart[index].quantity < 1) {
                const removed = cart.splice(index, 1);
                showNotification(`"${removed[0].name}" eliminado.`, 'error');
            }
            localStorage.setItem("cart", JSON.stringify(cart));
            renderCart();
        }
    });

    renderCart();
});