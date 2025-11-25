🌸 Harajuku en Casa - E-commerce Full Stack
Harajuku en Casa es una plataforma de comercio electrónico moderna, segura y escalable, diseñada para la venta de moda Harajuku y cultura pop japonesa en Latinoamérica.

Este proyecto implementa una arquitectura MERN (MongoDB, Express, React, Node.js) completa, integrando pagos reales mediante Stripe, gestión de usuarios con roles (RBAC), un sistema de comunidad (foro) y un panel administrativo robusto.

🌐 Demo en Vivo
La aplicación se encuentra desplegada y operativa en la nube:

Frontend (Vercel): https://harajuku-en-casa.vercel.app

Backend (Render): API RESTful servida internamente.

🏗️ Arquitectura de la Solución
El sistema sigue una arquitectura de Cliente-Servidor desacoplada, comunicándose a través de una API RESTful segura.

Frontend (SPA): Desarrollado en React con Vite. Gestiona el estado global mediante Context API (Auth & Cart) y utiliza React Router para la navegación.

Backend (API): Servidor Node.js con Express. Maneja la lógica de negocio, autenticación JWT, integración con pasarelas de pago y conexión a base de datos.

Base de Datos: MongoDB Atlas (NoSQL) para almacenamiento flexible de productos, usuarios, órdenes y reportes.

Servicios Externos:

Stripe: Procesamiento de pagos y webhooks.

ImgBB: Alojamiento de imágenes de perfil y productos.

📂 Estructura de Directorios
Bash

harajuku-en-casa/
├── backend/                 # Servidor Node.js
│   ├── models/              # Esquemas de Mongoose (User, Product, Order, Report)
│   ├── Imagenes/            # Almacenamiento temporal o estático
│   ├── server.js            # Punto de entrada, configuración de Express y Rutas
│   ├── seed.js              # Script para poblar la base de datos inicial
│   └── package.json         # Dependencias del backend
│
├── frontend/                # Aplicación React (Vite)
│   ├── public/              # Activos estáticos (Imágenes, Logos)
│   ├── src/
│   │   ├── assets/          # Estilos CSS globales y por página
│   │   ├── components/      # Componentes reutilizables (Navbar, Footer, Cards)
│   │   ├── context/         # Estado Global (AuthContext, CartContext)
│   │   ├── Pages/           # Vistas principales (Home, Checkout, Admin, Foro)
│   │   ├── App.jsx          # Configuración de Rutas
│   │   └── main.jsx         # Punto de entrada
│   └── package.json         # Dependencias del frontend
│
└── README.md                # Documentación del proyecto
🚀 Características Principales
🛍️ E-commerce Core
Catálogo Dinámico: Filtrado por categorías y gestión de inventario en tiempo real.

Carrito de Compras: Persistencia local y sincronización con base de datos al iniciar sesión.

Wishlist: Gestión de productos favoritos.

Pagos Seguros: Integración completa con Stripe (PaymentIntents + Webhooks) para validación de transacciones server-side.

👤 Gestión de Usuarios
Autenticación: Registro y Login seguro con JWT (JSON Web Tokens) y hashing de contraseñas con Bcrypt.

Perfil: Edición de datos, historial de pedidos y subida de avatar (integración ImgBB).

💬 Comunidad (Foro)
Interacción: Creación de posts, comentarios y respuestas anidadas.

Moderación: Sistema de reportes de contenido inapropiado.

Social: Likes y Dislikes en comentarios.

🛡️ Panel de Administración
Dashboard: Control total sobre productos (CRUD), usuarios y pedidos.

Roles: Sistema de permisos para Administradores.

Moderación: Panel para resolver reportes, eliminar contenido o silenciar usuarios problemáticos.

⚙️ Instalación y Ejecución Local
Sigue estos pasos para levantar el entorno de desarrollo en tu máquina.

Prerrequisitos
Node.js (v16+)

MongoDB Atlas (Connection String)

Cuenta en Stripe (API Keys)

Cuenta en ImgBB (API Key)

ngrok (Esencial para probar los Webhooks de Stripe localmente)

1. Configuración del Backend
Navega a la carpeta del backend e instala dependencias:

Bash

cd backend
npm install
Crea un archivo .env en backend/ con las siguientes variables:

Fragmento de código

MONGO_URI="tu_mongodb_connection_string"
JWT_SECRET="tu_secreto_jwt"
PORT=3000

# URLs
CORS_ORIGIN="http://localhost:5173"
FRONTEND_URL="http://localhost:5173"
# Esta URL la obtendrás al iniciar ngrok
BACKEND_URL="https://[TU_URL_NGROK].ngrok.free.dev" 

# APIs
IMGBB_API_KEY="tu_api_key_imgbb"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..." # Se obtiene al configurar el webhook en Stripe
(Opcional) Poblar Base de Datos: Si tu base de datos está vacía, ejecuta el script de semillas para crear productos de prueba:

Bash

npm run seed
2. Configuración del Webhook (Stripe + Ngrok)
Para que Stripe notifique a tu servidor local sobre pagos exitosos:

Inicia ngrok en el puerto 3000:

Bash

ngrok http 3000
Copia la URL HTTPS generada y actualiza BACKEND_URL en tu .env.

En el Dashboard de Stripe > Webhooks, crea un endpoint apuntando a: https://[TU_URL_NGROK]/api/payment/stripe-webhook

Selecciona los eventos payment_intent.succeeded y payment_intent.payment_failed.

Copia el "Signing Secret" y pégalo en STRIPE_WEBHOOK_SECRET en tu .env.

3. Configuración del Frontend
Navega a la carpeta del frontend e instala dependencias:

Bash

cd ../frontend
npm install
Crea un archivo .env en frontend/ con las claves públicas:

Fragmento de código

VITE_API_BASE_URL="http://localhost:3000/api"
VITE_STRIPE_PUBLIC_KEY="pk_test_..." 
4. Ejecución
Abre dos terminales:

Terminal 1 (Backend):

Bash

cd backend
node server.js
Terminal 2 (Frontend):

Bash

cd frontend
npm run dev
Abre http://localhost:5173 y ¡disfruta desarrollando!

✒️ Autores
Este proyecto fue desarrollado con ❤️ y mucho café por:

Juan David Gutiérrez Reyes - Full Stack Developer

Sofía Ortiz Daza - Full Stack Developer

Proyecto académico - Universidad Católica de Colombia - 2025
