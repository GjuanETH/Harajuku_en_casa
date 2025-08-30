// ==========================
// Variables globales
// ==========================
const productsGrid = document.getElementById("productsGrid");
const cartCount = document.getElementById("cartCount");

// ==========================
// Tus productos reales
// ==========================
const sampleProducts = [
  {
    id: 1,
    name: "Falda con encaje",
    description: "Falda cómoda con encajes y lazos. Perfecta para looks casuales.",
    price: 45000,
    category: "ropa",
    image: "https://via.placeholder.com/300x300/FFB6C1/000000?text=Falda+Encaje",
    brand: "W Aster"
  },
  {
    id: 2,
    name: "Vestido estilo lolita",
    description: "Vestido escotado color cyan con capas de tela en la falda.",
    price: 85000,
    category: "ropa",
    image: "https://via.placeholder.com/300x300/87CEEB/000000?text=Vestido+Lolita",
    brand: "W Aster"
  },
  {
    id: 3,
    name: "Conjunto de falda y medias",
    description: "Falda y medias color negro y rojo con encaje y detalles lacados.",
    price: 65000,
    category: "ropa",
    image: "https://via.placeholder.com/300x300/FF0000/FFFFFF?text=Conjunto+Falda",
    brand: "W Aster"
  },
  {
    id: 4,
    name: "Medias estilo calentador",
    description: "Medias largas de lana roja con diseño de estrellas.",
    price: 25000,
    category: "ropa",
    image: "https://via.placeholder.com/300x300/FF4500/FFFFFF?text=Medias+Calentador",
    brand: "W Aster"
  },
  {
    id: 5,
    name: "Vestido lolita gótico con rosa",
    description: "Vestido estilo lolita con detalles y encaje rosado.",
    price: 70000,
    category: "ropa",
    image: "https://via.placeholder.com/300x300/800080/FFFFFF?text=Vestido+Gótico",
    brand: "W Aster"
  },
  {
    id: 6,
    name: "Conjunto cute",
    description: "Conjunto de camiseta, falda y chaqueta en tonos pastel.",
    price: 80000,
    category: "ropa",
    image: "https://via.placeholder.com/300x300/FFC0CB/000000?text=Conjunto+Cute",
    brand: "W Aster"
  },
  {
    id: 7,
    name: "Conjunto Hada Kel",
    description: "Conjunto Hada kel en blanco 4 piezas.",
    price: 100000,
    category: "ropa",
    image: "https://via.placeholder.com/300x300/FFFFFF/000000?text=Conjunto+Hada",
    brand: "W Aster"
  },
  {
    id: 8,
    name: "Diadema de gato",
    description: "Diadema para el cabello negro con gatito y redina.",
    price: 25000,
    category: "accesorios",
    image: "https://via.placeholder.com/300x300/000000/FFFFFF?text=Diadema+Gato",
    brand: "W Aster"
  },
  {
    id: 9,
    name: "Accesorios Decora",
    description: "Set de anillos y joyas para outfit Decora.",
    price: 15000,
    category: "accesorios",
    image: "https://via.placeholder.com/300x300/FFD700/000000?text=Accesorios+Decora",
    brand: "W Aster"
  },
  {
    id: 10,
    name: "Diadema de Maid",
    description: "Diadema estilo maid negra con encajes y moños.",
    price: 20000,
    category: "accesorios",
    image: "https://via.placeholder.com/300x300/000000/FFFFFF?text=Diadema+Maid",
    brand: "¥ Ancar"
  },
  {
    id: 11,
    name: "Set kawaii",
    description: "Set de 3 piezas, gorro, calentadores y guantes nota claro.",
    price: 43000,
    category: "accesorios",
    image: "https://via.placeholder.com/300x300/ADD8E6/000000?text=Set+Kawaii",
    brand: "¥ Ancar"
  },
  {
    id: 12,
    name: "Accesorios para cabello",
    description: "Kit de diversos accesorios para el cabello estilo Decora.",
    price: 18000,
    category: "accesorios",
    image: "https://via.placeholder.com/300x300/FF69B4/000000?text=Accesorios+Cabello",
    brand: "¥ Ancar"
  },
  {
    id: 13,
    name: "Hebillas para el pelo",
    description: "Hebillas para el cabello hechas en laca pack de 2 hebillas.",
    price: 8000,
    category: "accesorios",
    image: "https://via.placeholder.com/300x300/FF6347/000000?text=Hebillas+Pelo",
    brand: "¥ Ancar"
  },
  {
    id: 14,
    name: "Mochila goth",
    description: "Mochila pequeña estilo goth de cuero.",
    price: 65000,
    category: "accesorios",
    image: "https://via.placeholder.com/300x300/2F4F4F/FFFFFF?text=Mochila+Goth",
    brand: "¥ Ancar"
  }
];

// ==========================
// Carrito compartido con localStorage
// ==========================
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// ==========================
// Renderizar productos
// ==========================
function renderProducts() {
  if (!productsGrid) return;
  productsGrid.innerHTML = "";
  
  sampleProducts.forEach((product) => {
    const card = document.createElement("div");
    card.classList.add("product-card");
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
          <button class="btn-add-cart" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}" data-image="${product.image}">
            <i class="fas fa-cart-plus"></i> Añadir
          </button>
          <button class="btn-wishlist">
            <i class="fas fa-heart"></i>
          </button>
        </div>
      </div>
    `;
    
    productsGrid.appendChild(card);
  });

  // Eventos para los botones de agregar al carrito
  const addBtns = productsGrid.querySelectorAll(".btn-add-cart");
  addBtns.forEach(btn => {
    btn.addEventListener("click", function() {
      const productId = Number(this.getAttribute("data-id"));
      const productName = this.getAttribute("data-name");
      const productPrice = Number(this.getAttribute("data-price"));
      let productImage = this.getAttribute("data-image");
      
      // Si no hay imagen, usar una por defecto
      if (!productImage || productImage === "") {
        productImage = "https://via.placeholder.com/300x300/F2D3E4/000000?text=Harajuku";
      }
      
      addToCart(productId, productName, productPrice, productImage);
      
      // Efecto visual de confirmación
      this.innerHTML = '<i class="fas fa-check"></i> Añadido';
      this.classList.add('added');
      setTimeout(() => {
        this.innerHTML = '<i class="fas fa-cart-plus"></i> Añadir';
        this.classList.remove('added');
      }, 1500);
    });
  });
}

// Formatear números con separadores de miles
function formatNumber(number) {
  return new Intl.NumberFormat('es-CO').format(number);
}

// ==========================
// Funciones del Carrito
// ==========================
function addToCart(id, name, price, image) {
  // Buscar si el producto ya está en el carrito
  const existingProductIndex = cart.findIndex(item => item.id === id);
  
  if (existingProductIndex > -1) {
    // Si ya existe, aumentar la cantidad
    cart[existingProductIndex].quantity += 1;
  } else {
    // Si no existe, añadirlo al carrito
    const product = {
      id: id,
      name: name,
      price: price,
      image: image,
      quantity: 1
    };
    cart.push(product);
  }
  
  updateCart();
  
  // Mostrar notificación
  showNotification('¡Producto añadido al carrito!');
}

function updateCart() {
  // Actualiza el contador en el header
  if (cartCount) cartCount.textContent = cart.length;
  // Guarda el carrito en localStorage
  localStorage.setItem("cart", JSON.stringify(cart));
}

function showNotification(message) {
  // Crear elemento de notificación
  const notification = document.createElement('div');
  notification.className = 'cart-notification';
  notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
  document.body.appendChild(notification);
  
  // Mostrar notificación
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Ocultar y eliminar notificación después de 3 segundos
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Inicializa el contador al cargar la página
updateCart();

// Si quieres que el contador se actualice cuando vuelvas a la página
window.addEventListener("storage", function() {
  cart = JSON.parse(localStorage.getItem("cart")) || [];
  updateCart();
});

// Filtrado de productos
function setupFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  if (filterButtons.length === 0) return;
  
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Quitar la clase active de todos los botones
      filterButtons.forEach(btn => btn.classList.remove('active'));
      
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
}

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
  renderProducts();
  setupFilters();
});