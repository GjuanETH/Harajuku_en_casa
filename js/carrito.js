// Actualiza el contador del carrito en el header usando localStorage
        function updateCartCount() {
            const cartCount = document.getElementById("cartCount");
            const cart = JSON.parse(localStorage.getItem("cart")) || [];
            if(cartCount) cartCount.textContent = cart.length;
            
            // Mostrar u ocultar el mensaje de carrito vacío
            const emptyCart = document.getElementById("emptyCart");
            if (cart.length === 0) {
                emptyCart.style.display = 'block';
            } else {
                emptyCart.style.display = 'none';
            }
        }
        
        // Formatear números con separadores de miles
        function formatNumber(number) {
            return new Intl.NumberFormat('es-CO').format(number);
        }

        // Mostrar los productos del carrito
        function renderCart() {
            const cartItems = document.getElementById("cartItems");
            const cartTotal = document.getElementById("cartTotal");
            let cart = JSON.parse(localStorage.getItem("cart")) || [];
            cartItems.innerHTML = "";
            let total = 0;

            if(cart.length === 0) {
                updateCartCount();
                return;
            } else {
                cart.forEach((product, index) => {
                    const productTotal = product.price * product.quantity;
                    total += productTotal;
                    
                    const item = document.createElement("div");
                    item.classList.add("cart-item");
                    item.innerHTML = `
                        <div class="cart-item-image">
                            <img src="${product.image}" alt="${product.name}">
                        </div>
                        <div class="cart-item-details">
                            <h4 class="cart-item-title">${product.name}</h4>
                            <p class="cart-item-price">$${formatNumber(product.price)} COP c/u</p>
                            <div class="cart-item-quantity">
                                <button class="quantity-btn" onclick="updateQuantity(${index}, ${product.quantity - 1})">-</button>
                                <span class="quantity">${product.quantity}</span>
                                <button class="quantity-btn" onclick="updateQuantity(${index}, ${product.quantity + 1})">+</button>
                            </div>
                        </div>
                        <div class="cart-item-total">
                            <p>$${formatNumber(productTotal)} COP</p>
                            <button class="remove-btn" onclick="removeFromCart(${index})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                    cartItems.appendChild(item);
                });
            }
            cartTotal.textContent = formatNumber(total);
            updateCartCount();
        }

        // Actualizar cantidad de producto
        function updateQuantity(index, newQuantity) {
            if (newQuantity < 1) return;
            
            let cart = JSON.parse(localStorage.getItem("cart")) || [];
            cart[index].quantity = newQuantity;
            localStorage.setItem("cart", JSON.stringify(cart));
            renderCart();
        }

        // Eliminar producto del carrito
        function removeFromCart(index) {
            let cart = JSON.parse(localStorage.getItem("cart")) || [];
            cart.splice(index, 1);
            localStorage.setItem("cart", JSON.stringify(cart));
            renderCart();
            
            // Mostrar notificación de producto eliminado
            const notification = document.createElement('div');
            notification.className = 'cart-notification';
            notification.innerHTML = '<i class="fas fa-check-circle"></i> Producto eliminado del carrito';
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.classList.add('show');
            }, 10);
            
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 2000);
        }

        // Inicializar carrito al cargar la página
        document.addEventListener('DOMContentLoaded', function() {
            renderCart();
            
            // ⭐⭐ CONFIGURACIÓN ACTUALIZADA DEL BOTÓN DE PAGO ⭐⭐
            document.getElementById('checkoutBtn').addEventListener('click', function() {
                const cart = JSON.parse(localStorage.getItem("cart")) || [];
                if (cart.length === 0) {
                    // Mostrar notificación estilo kawaii en lugar de alerta básica
                    const notification = document.createElement('div');
                    notification.className = 'cart-notification error';
                    notification.innerHTML = '<i class="fas fa-exclamation-circle"></i> ¡Tu carrito está vacío!';
                    document.body.appendChild(notification);
                    
                    setTimeout(() => {
                        notification.classList.add('show');
                    }, 10);
                    
                    setTimeout(() => {
                        notification.classList.remove('show');
                        setTimeout(() => {
                            document.body.removeChild(notification);
                        }, 300);
                    }, 3000);
                    return;
                }
                
                // Animación de carga en el botón
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redirigiendo...';
                this.disabled = true;
                
                // Redirigir después de un breve retraso para mejor UX
                setTimeout(() => {
                    window.location.href = "pago.html";
                }, 1000);
            });
        });
        
        window.addEventListener("storage", function() {
            updateCartCount();
            renderCart();
        });