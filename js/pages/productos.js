document.addEventListener('DOMContentLoaded', function() {
    const productsGrid = document.getElementById("productsGrid");
    if (!productsGrid) return;

    let fetchedProducts = []; // Guardaremos los productos aquí para tener acceso a ellos

    async function renderProducts() {
        productsGrid.innerHTML = "<p class='loading-message'>Cargando productos kawaii...</p>";
        try {
            const response = await fetch('http://localhost:3000/api/products');
            if (!response.ok) throw new Error('Error de red.');

            fetchedProducts = await response.json(); // Guardamos los productos en la variable

            productsGrid.innerHTML = "";
            if (fetchedProducts.length === 0) {
                productsGrid.innerHTML = "<p>No hay productos disponibles.</p>";
                return;
            }

            fetchedProducts.forEach((product) => {
                const card = document.createElement("div");
                card.className = "product-card";
                card.dataset.category = product.category;
                card.innerHTML = `
                    <div class="product-image">
                        <img src="${product.imageUrl}" alt="${product.name}">
                    </div>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p>${product.description}</p>
                        <div class="product-price">$${formatNumber(product.price)}</div>
                        <div class="product-brand">${product.brand}</div>
                        <div class="product-actions">
                            <button class="btn-add-cart" data-id="${product._id}">
                                <i class="fas fa-cart-plus"></i> Añadir
                            </button>
                            <button class="btn-wishlist"><i class="fas fa-heart"></i></button>
                        </div>
                    </div>
                `;
                productsGrid.appendChild(card);
            });
            setupFilters();
        } catch (error) {
            console.error("Error al obtener productos:", error);
            productsGrid.innerHTML = "<p class='error-message'>Error al cargar productos.</p>";
        }
    }
    /**
     * Configura los filtros de categoría para que funcionen con los productos renderizados.
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

    // --- MANEJO DE EVENTOS CENTRALIZADO ---
     // --- MANEJADOR DE EVENTOS ACTUALIZADO ---
    productsGrid.addEventListener('click', function(event) {
        const addButton = event.target.closest('.btn-add-cart');
        if (addButton) {
            const productId = addButton.dataset.id;

            // Buscamos el producto completo en la lista que ya obtuvimos
            const productToAdd = fetchedProducts.find(p => p._id === productId);

            if (productToAdd) {
                // ¡Llamamos a la función GLOBAL con el objeto de producto COMPLETO!
                addToCart(productToAdd);

                // Efecto visual
                addButton.innerHTML = '<i class="fas fa-check"></i> Añadido';
                addButton.classList.add('added');
                setTimeout(() => {
                    addButton.innerHTML = '<i class="fas fa-cart-plus"></i> Añadir';
                    addButton.classList.remove('added');
                }, 1500);
            }
        }
    });

    renderProducts();
});