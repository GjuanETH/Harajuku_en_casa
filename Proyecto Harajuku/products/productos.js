
        // Actualiza el contador del carrito en el header usando localStorage
        function updateCartCount() {
            const cartCount = document.getElementById("cartCount");
            const cart = JSON.parse(localStorage.getItem("cart")) || [];
            if(cartCount) cartCount.textContent = cart.length;
        }
        
        // Función para añadir productos al carrito
        document.querySelectorAll('.btn-add-cart').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                
                const product = {
                    id: this.dataset.id,
                    name: this.dataset.name,
                    price: parseInt(this.dataset.price),
                    image: this.dataset.image,
                    quantity: 1
                };
                
                let cart = JSON.parse(localStorage.getItem('cart')) || [];
                
                // Verificar si el producto ya está en el carrito
                const existingProductIndex = cart.findIndex(item => item.id === product.id);
                
                if (existingProductIndex > -1) {
                    // Si ya existe, aumentar la cantidad
                    cart[existingProductIndex].quantity += 1;
                } else {
                    // Si no existe, añadirlo al carrito
                    cart.push(product);
                }
                
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartCount();
                
                // Mostrar mensaje de confirmación
                const confirmation = document.createElement('div');
                confirmation.textContent = '¡Producto añadido al carrito!';
                confirmation.style.position = 'fixed';
                confirmation.style.bottom = '20px';
                confirmation.style.right = '20px';
                confirmation.style.backgroundColor = 'var(--mint)';
                confirmation.style.color = 'var(--black)';
                confirmation.style.padding = '10px 20px';
                confirmation.style.borderRadius = 'var(--border-radius)';
                confirmation.style.zIndex = '1000';
                confirmation.style.boxShadow = 'var(--shadow)';
                document.body.appendChild(confirmation);
                
                // Eliminar el mensaje después de 3 segundos
                setTimeout(() => {
                    confirmation.style.opacity = '0';
                    confirmation.style.transition = 'opacity 0.5s';
                    setTimeout(() => document.body.removeChild(confirmation), 500);
                }, 3000);
            });
        });
        
        // Filtrado de productos
        document.querySelectorAll('.filter-btn').forEach(button => {
            button.addEventListener('click', function() {
                // Quitar la clase active de todos los botones
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Añadir la clase active al botón clickeado
                this.classList.add('active');
                
                const category = this.dataset.category;
                const products = document.querySelectorAll('.product-card');
                
                products.forEach(product => {
                    if (category === 'all' || product.dataset.category === category) {
                        product.style.display = 'block';
                        setTimeout(() => {
                            product.style.opacity = '1';
                            product.style.transform = 'translateY(0)';
                        }, 10);
                    } else {
                        product.style.opacity = '0';
                        product.style.transform = 'translateY(20px)';
                        setTimeout(() => {
                            product.style.display = 'none';
                        }, 300);
                    }
                });
            });
        });
        
        updateCartCount();
        window.addEventListener("storage", updateCartCount);
