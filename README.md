# Harajuku en Casa - Plataforma de E-commerce Full-Stack

Este repositorio contiene la implementación completa de "Harajuku en Casa", una plataforma de e-commerce moderna y funcional especializada en la venta de moda Harajuku, productos kawaii y artículos de cultura pop japonesa para el mercado latinoamericano.

La aplicación consta de dos partes principales: un **frontend** desarrollado con React (Vite) y un **backend** construido con Node.js (Express), utilizando MongoDB como base de datos. Incluye funcionalidades completas de usuario, carrito de compras, lista de deseos, y un robusto panel de administración para la gestión de productos, usuarios y pedidos.

## 🚀 Características Principales

* **Autenticación de Usuarios:** Registro, inicio de sesión y persistencia de sesión con JWT.
* **Gestión de Perfil:** Los usuarios pueden actualizar su información personal y subir avatares.
* **Catálogo de Productos:** Exploración de productos por categorías, detalles de cada artículo.
* **Carrito de Compras:** Añadir, actualizar y eliminar productos del carrito. Sincronización entre sesiones.
* **Lista de Deseos (Wishlist):** Guardar productos favoritos para futuras compras.
* **Gestión de Pedidos:** Los usuarios pueden ver su historial de pedidos y cancelar pedidos pendientes.
* **Panel de Administración:**
    * **Gestión de Productos:** Crear, leer, actualizar y eliminar productos del catálogo.
    * **Gestión de Usuarios:** Ver, buscar, y actualizar roles de usuario (administrador/usuario regular), así como eliminar usuarios.
    * **Gestión de Pedidos:** Ver todos los pedidos, detalles y actualizar el estado de cada uno.

## 💻 Tecnologías Utilizadas

### Frontend
* **React (con Vite):** Biblioteca para construir interfaces de usuario eficientes y rápidas.
* **React Router DOM:** Para la navegación y enrutamiento en la aplicación de una sola página (SPA).
* **Axios:** Cliente HTTP basado en promesas para realizar solicitudes a la API del backend.
* **HTML5 & CSS3:** Estructuración semántica y estilos modernos.
* **JavaScript (ES6+):** Lógica interactiva del lado del cliente.

### Backend
* **Node.js:** Entorno de ejecución de JavaScript.
* **Express.js:** Framework web para construir la API RESTful.
* **MongoDB Atlas:** Base de datos NoSQL basada en documentos para almacenar datos de productos, usuarios y pedidos.
* **Mongoose:** ODM (Object Data Modeling) para MongoDB en Node.js, facilitando la interacción con la base de datos.
* **JWT (JSON Web Tokens):** Para la autenticación y autorización segura de usuarios.
* **Bcrypt.js:** Para el hash seguro de contraseñas.
* **CORS:** Middleware para habilitar solicitudes de origen cruzado.
* **Multer:** Middleware para manejar la subida de archivos (e.g., avatares).
* **ImgBB API:** Servicio de terceros para alojar imágenes de avatares.
* **Dotenv:** Para gestionar variables de entorno.

## ⚙️ Cómo Ejecutar el Proyecto

Este proyecto requiere que tanto el backend como el frontend se ejecuten simultáneamente.

### Prerrequisitos

* **Node.js:** (versión LTS recomendada) instalado en tu sistema.
* **MongoDB Atlas:** Una cuenta y un clúster configurado. Necesitarás la cadena de conexión.
* **ImgBB API Key:** Una clave de API de ImgBB para la subida de avatares (opcional, pero las subidas fallarán sin ella).

### 1. Configuración del Backend

1.  **Clona el repositorio:**
    ```bash
    git clone [https://github.com/GjuanETH/Harajuku_en_casa.git](https://github.com/GjuanETH/Harajuku_en_casa.git)
    cd Harajuku_en_casa
    ```

2.  **Navega a la carpeta del backend:**
    ```bash
    cd backend # o el nombre de tu carpeta de backend si es diferente (ej: 'server')
    ```

3.  **Instala las dependencias del backend:**
    ```bash
    npm install
    # o
    yarn install
    ```

4.  **Crea un archivo `.env`:**
    En la raíz de la carpeta del backend, crea un archivo llamado `.env` y añade las siguientes variables:
    ```env
    MONGO_URI="tu_cadena_de_conexion_mongodb_atlas"
    JWT_SECRET="una_cadena_secreta_fuerte_para_JWT"
    IMGBB_API_KEY="tu_clave_api_imgbb"
    CORS_ORIGIN="http://localhost:5173" # O el puerto donde se ejecuta tu frontend (ej. http://localhost:3000 si usas Create React App por defecto)
    PORT=3000 # O el puerto que prefieras para el backend
    ```
    * **`MONGO_URI`**: Obtén esta cadena de conexión desde tu clúster de MongoDB Atlas.
    * **`JWT_SECRET`**: Genera una cadena alfanumérica larga y aleatoria. ¡No uses algo simple como "secreto"!
    * **`IMGBB_API_KEY`**: Regístrate en ImgBB para obtener tu clave de API gratuita si planeas usar la subida de avatares.
    * **`CORS_ORIGIN`**: Este es crucial. Debe coincidir con la URL y el puerto donde se ejecutará tu frontend. Por defecto, Vite usa `http://localhost:5173`.

5.  **Inicia el servidor backend:**
    ```bash
    npm start
    # o
    node server.js # si tu archivo principal es server.js
    ```
    Verás mensajes en la consola indicando que el backend está conectado a MongoDB y escuchando en el puerto configurado (ej. `http://localhost:3000`).

### 2. Configuración del Frontend

1.  **Abre una nueva terminal.**

2.  **Navega a la carpeta del frontend:**
    ```bash
    cd frontend # o el nombre de tu carpeta de frontend (ej: 'client' o 'harajuku_en_casa_frontend')
    ```

3.  **Instala las dependencias del frontend:**
    ```bash
    npm install
    # o
    yarn install
    ```

4.  **Crea un archivo `.env` (en el frontend):**
    En la raíz de la carpeta del frontend, crea un archivo llamado `.env` y añade la siguiente variable:
    ```env
    VITE_API_BASE_URL="http://localhost:3000/api" # Debe coincidir con la URL de tu backend
    ```
    * **`VITE_API_BASE_URL`**: Asegúrate de que esta URL apunte al puerto y la ruta `/api` de tu servidor backend.

5.  **Inicia la aplicación frontend:**
    ```bash
    npm run dev
    # o
    yarn dev
    ```
    Esto abrirá automáticamente tu navegador web en la dirección `http://localhost:5173` (o un puerto similar donde Vite esté ejecutando la aplicación).

¡Felicidades\! Ahora tienes "Harajuku en Casa" funcionando completamente en tu entorno local.

## 📝 Autores

* **Juan David Gutiérrez Reyes**
* **Sofía Ortiz Daza**
