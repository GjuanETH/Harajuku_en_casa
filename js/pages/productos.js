// ======================================================
// LÓGICA ESPECÍFICA PARA LA PÁGINA DE PRODUCTOS
// ======================================================

document.addEventListener('DOMContentLoaded', function() {
    // Seleccionamos el contenedor principal de productos
    const productsGrid = document.getElementById("productsGrid");

    // Si no estamos en la página de productos, detenemos la ejecución.
    if (!productsGrid) return;

    /**
     * Renderiza los productos en la cuadrícula del HTML, tomándolos de data.js.
     */
    function renderProducts() {
        // Usamos la variable global 'sampleProducts' que viene de data.js
        sampleProducts.forEach((product) => {
            const card = document.createElement("div");
            card.className = "product-card";
            card.dataset.category = product.category;
            // Llamamos a la función global formatNumber() de app.js
            card.innerHTML = `
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <div class="product-price">$${formatNumber(product.price)}</div>
                    <div class="product-brand">${product.brand}</div>
                    <div class="product-actions">
                        <button class="btn-add-cart" data-id="${product.id}">
                            <i class="fas fa-cart-plus"></i> Añadir
                        </button>
                        <button class="btn-wishlist"><i class="fas fa-heart"></i></button>
                    </div>
                </div>
            `;
            productsGrid.appendChild(card);
        });
    }

    /**
     * Configura los filtros de categoría.
     */
    function setupFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                const category = this.dataset.category;
                const products = document.querySelectorAll('.product-card');
                
                products.forEach(product => {
                    if (category === 'all' || product.dataset.category === category) {
                        product.classList.remove('hidden');
                    } else {
                        product.classList.add('hidden');
                    }
                });
            });
        });
    }

    // --- MANEJO DE EVENTOS (MEJORADO CON DELEGACIÓN) ---
    productsGrid.addEventListener('click', function(event) {
        const addButton = event.target.closest('.btn-add-cart');
        
        if (addButton) {
            const productId = Number(addButton.dataset.id);

            // ¡Llamamos a la función GLOBAL 'addToCart' que vive en app.js!
            addToCart(productId); 
            
            // Efecto visual de confirmación
            addButton.innerHTML = '<i class="fas fa-check"></i> Añadido';
            addButton.classList.add('added');
            setTimeout(() => {
                addButton.innerHTML = '<i class="fas fa-cart-plus"></i> Añadir';
                addButton.classList.remove('added');
            }, 1500);
        }
    });

    // --- INICIALIZACIÓN DE LA PÁGINA ---
    renderProducts();
    setupFilters();
});