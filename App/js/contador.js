        // Actualiza el contador del carrito en el header usando localStorage
        function updateCartCount() {
            const cartCount = document.getElementById("cartCount");
            const cart = JSON.parse(localStorage.getItem("cart")) || [];
            if(cartCount) cartCount.textContent = cart.length;
        }
        updateCartCount();

        // Si quieres que el contador se actualice cuando vuelvas a la página
        window.addEventListener("storage", updateCartCount);