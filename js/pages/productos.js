// ======================================================
// LÓGICA ESPECÍFICA PARA LA PÁGINA DE PRODUCTOS (CONECTADA A LA API)
// ======================================================

document.addEventListener('DOMContentLoaded', function() {
    const productsGrid = document.getElementById("productsGrid");
    if (!productsGrid) return; // Si no es la página de productos, no hacemos nada.

    /**
     * Obtiene los productos desde el backend y los renderiza en el HTML.
     */
    async function renderProducts() {
        // Muestra un estado de "cargando" para mejorar la experiencia de usuario
        productsGrid.innerHTML = "<p>Cargando productos...</p>";
        try {
            const response = await fetch('http://localhost:3000/api/products');
            if (!response.ok) {
                throw new Error('La respuesta de la red no fue exitosa.');
            }
            const products = await response.json();

            productsGrid.innerHTML = ""; // Limpiamos el mensaje de "cargando"

            if (products.length === 0) {
                productsGrid.innerHTML = "<p>No hay productos disponibles en este momento.</p>";
                return;
            }

            products.forEach((product) => {
                const card = document.createElement("div");
                card.className = "product-card";
                card.dataset.category = product.category;
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
                            <button class="btn-add-cart" data-id="${product._id}">
                                <i class="fas fa-cart-plus"></i> Añadir
                            </button>
                            <button class="btn-wishlist"><i class="fas fa-heart"></i></button>
                        </div>
                    </div>
                `;
                productsGrid.appendChild(card);
            });
            // Una vez renderizados los productos, activamos los filtros
            setupFilters();

        } catch (error) {
            console.error("Error al obtener los productos:", error);
            productsGrid.innerHTML = "<p>Error al cargar los productos. Intenta de nuevo más tarde.</p>";
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
    productsGrid.addEventListener('click', function(event) {
        const addButton = event.target.closest('.btn-add-cart');
        if (addButton) {
            // MongoDB usa _id como identificador, no id.
            const productId = addButton.dataset.id; 
            
            // Llamamos a la función GLOBAL 'addToCart' que vive en app.js
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
});