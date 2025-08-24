// Actualiza el contador del carrito en el header usando localStorage
        function updateCartCount() {
            const cartCount = document.getElementById("cartCount");
            const cart = JSON.parse(localStorage.getItem("cart")) || [];
            if(cartCount) cartCount.textContent = cart.length;
        }
        updateCartCount();

        // Mostrar resumen del pedido
        function renderOrderSummary() {
            const orderItems = document.getElementById("orderItems");
            const subtotalEl = document.getElementById("subtotal");
            const shippingEl = document.getElementById("shipping");
            const totalEl = document.getElementById("total");
            
            let cart = JSON.parse(localStorage.getItem("cart")) || [];
            orderItems.innerHTML = "";
            let subtotal = 0;

            if(cart.length === 0) {
                orderItems.innerHTML = '<p class="empty-order">No hay productos en tu carrito</p>';
                window.location.href = "/carrito/carrito.html";
                return;
            } else {
                cart.forEach((product, index) => {
                    const productTotal = product.price * product.quantity;
                    subtotal += productTotal;
                    
                    const item = document.createElement("div");
                    item.classList.add("order-item");
                    item.innerHTML = `
                        <div class="order-item-image">
                            <img src="${product.image}" alt="${product.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjJkM2U0IiAvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkeT0iLjM1ZW0iIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM4ODg4ODgiPkhhcmFqdWt1PC90ZXh0PgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkeT0iMS41ZW0iIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM4ODg4ODgiPmVuIENhc2E8L3RleHQ+Cjwvc3ZnPgo='">
                        </div>
                        <div class="order-item-info">
                            <h4>${product.name}</h4>
                            <p>${product.quantity} x $${formatNumber(product.price)}</p>
                        </div>
                        <div class="order-item-total">
                            $${formatNumber(productTotal)}
                        </div>
                    `;
                    orderItems.appendChild(item);
                });
            }
            
            // Calcular envío (gratis para compras superiores a $100.000)
            const shipping = subtotal > 100000 ? 0 : 10000;
            const total = subtotal + shipping;
            
            subtotalEl.textContent = formatNumber(subtotal);
            shippingEl.textContent = formatNumber(shipping);
            totalEl.textContent = formatNumber(total);
            
            return total;
        }

        // Formatear números con separadores de miles
        function formatNumber(number) {
            return new Intl.NumberFormat('es-CO').format(number);
        }

        // Inicializar Mercado Pago
        function initializeMercadoPago(total) {
            // Aquí integrarías con la API de Mercado Pago
            // Este es un ejemplo básico de integración
            
            const mp = new MercadoPago('TEST-12345678-1234-1234-1234-123456789012', {
                locale: 'es-CO'
            });
            
            // Simulamos la creación de un botón de pago después de un breve tiempo
            setTimeout(() => {
                document.querySelector('.mp-loading').style.display = 'none';
                
                // En una implementación real, aquí crearías el formulario de pago
                const paymentForm = document.createElement('div');
                paymentForm.innerHTML = `
                    <div class="card-form">
                        <div class="form-group">
                            <label for="cardNumber">Número de tarjeta</label>
                            <div class="input-with-icon">
                                <i class="fas fa-credit-card"></i>
                                <input type="text" id="cardNumber" placeholder="1234 5678 9012 3456" maxlength="19">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="expiryDate">Fecha de expiración</label>
                                <input type="text" id="expiryDate" placeholder="MM/AA" maxlength="5">
                            </div>
                            <div class="form-group">
                                <label for="securityCode">CVV</label>
                                <input type="text" id="securityCode" placeholder="123" maxlength="3">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="cardholderName">Nombre del titular</label>
                            <input type="text" id="cardholderName" placeholder="Como aparece en la tarjeta">
                        </div>
                    </div>
                `;
                
                document.getElementById('mercadoPagoForm').appendChild(paymentForm);
            }, 2000);
        }

        // Inicializar cuando el DOM esté cargado
        document.addEventListener('DOMContentLoaded', function() {
            const total = renderOrderSummary();
            initializeMercadoPago(total);
            
            // Cambiar método de pago
            document.querySelectorAll('.payment-option').forEach(option => {
                option.addEventListener('click', function() {
                    document.querySelectorAll('.payment-option').forEach(opt => {
                        opt.classList.remove('active');
                    });
                    this.classList.add('active');
                    
                    // Aquí cambiarías el formulario según el método de pago seleccionado
                    const method = this.dataset.method;
                    // Lógica para cambiar entre métodos de pago
                });
            });
            
            // Enviar formulario de pago
            document.getElementById('submitPayment').addEventListener('click', function() {
                // Validar formulario antes de enviar
                const name = document.getElementById('name').value;
                const email = document.getElementById('email').value;
                const address = document.getElementById('address').value;
                
                if (!name || !email || !address) {
                    alert('Por favor, completa todos los campos obligatorios.');
                    return;
                }
                
                // Simular procesamiento de pago
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
                this.disabled = true;
                
                // Limpiar carrito
                localStorage.removeItem('cart');
                // Redirigir inmediatamente a página de confirmación
                window.location.href = '/carrito/pago/confirmacion/confirmacion.html';
                });
        });