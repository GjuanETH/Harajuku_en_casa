# Harajuku en Casa - Plataforma de E-commerce Full-Stack

Este repositorio contiene la implementación completa de "Harajuku en Casa", una plataforma de e-commerce moderna y funcional especializada en la venta de moda Harajuku, productos kawaii y artículos de cultura pop japonesa para el mercado latinoamericano.

La aplicación consta de dos partes principales: un **frontend** desarrollado con React (Vite) y un **backend** construido con Node.js (Express), utilizando MongoDB como base de datos. Incluye funcionalidades completas de usuario, carrito de compras, pasarela de pago segura con Stripe, un foro de comunidad y un robusto panel de administración.

## 🚀 Características Principales

  * **Autenticación de Usuarios:** Registro, inicio de sesión y persistencia de sesión con JWT.
  * **Gestión de Perfil:** Los usuarios pueden actualizar su información personal y subir avatares.
  * **Catálogo de Productos:** Exploración de productos por categorías, detalles de cada artículo.
  * **Carrito de Compras:** Añadir, actualizar y eliminar productos del carrito. Sincronización entre sesiones.
  * **Lista de Deseos (Wishlist):** Guardar productos favoritos para futuras compras.
  * **Pasarela de Pago Segura:** Integración con **Stripe** (usando Payment Intents y Webhooks) para un procesamiento de pagos con tarjeta seguro y que cumple con el estándar PCI. El cliente nunca abandona el sitio.
  * **Gestión de Pedidos:** Los usuarios pueden ver su historial de pedidos y cancelar pedidos pendientes.
  * **Comunidad (Foro):** Un sistema de foro completo donde los usuarios pueden crear *posts*, escribir *comentarios*, responder (con *replies* anidados), dar *like/dislike* y *reportar* contenido inapropiado.
  * **Panel de Administración:**
      * **Gestión de Productos:** Crear, leer, actualizar y eliminar productos del catálogo (CRUD).
      * **Gestión de Usuarios:** Ver, buscar, y actualizar roles de usuario (admin/user) y silenciar/eliminar usuarios.
      * **Gestión de Pedidos:** Ver todos los pedidos, detalles y actualizar el estado de cada uno.
      * **Gestión de Reportes:** Panel para revisar y moderar el contenido reportado por los usuarios en el foro.

## 💻 Tecnologías Utilizadas

### Frontend

  * **React (con Vite):** Biblioteca para construir interfaces de usuario eficientes y rápidas.
  * **React Router DOM:** Para la navegación y enrutamiento en la aplicación de una sola página (SPA).
  * **React Context API:** Para la gestión de estado global (Autenticación, Carrito).
  * **`fetch` API (Navegador):** Para realizar solicitudes a la API del backend.
  * **Stripe React (`@stripe/react-stripe-js`):** Para crear elementos de UI de pago seguros en el frontend.
  * **HTML5 & CSS3:** Estructuración semántica y estilos modernos.
  * **JavaScript (ES6+):** Lógica interactiva del lado del cliente.

### Backend

  * **Node.js:** Entorno de ejecución de JavaScript.
  * **Express.js:** Framework web para construir la API RESTful.
  * **MongoDB Atlas:** Base de datos NoSQL basada en documentos.
  * **Mongoose:** ODM (Object Data Modeling) para MongoDB.
  * **JWT (JSON Web Tokens):** Para la autenticación y autorización segura.
  * **Bcrypt.js:** Para el hash seguro de contraseñas.
  * **Stripe (`stripe`):** SDK de Node.js para crear intentos de pago (`PaymentIntents`) y verificar webhooks de forma segura.
  * **CORS:** Middleware para habilitar solicitudes de origen cruzado.
  * **Multer:** Middleware para manejar la subida de archivos (avatares).
  * **ImgBB API:** Servicio de terceros para alojar imágenes de avatares.
  * **Dotenv:** Para gestionar variables de entorno.

## ⚙️ Cómo Ejecutar el Proyecto

Este proyecto requiere que tanto el backend como el frontend se ejecuten simultáneamente. Para probar el flujo de pago, **es obligatorio el uso de `ngrok`** para que los webhooks de Stripe puedan comunicarse con tu servidor local.

### Prerrequisitos

  * **Node.js:** (versión LTS recomendada) instalado.
  * **MongoDB Atlas:** Una cuenta y un clúster configurado (necesitarás la cadena de conexión).
  * **Stripe:** Una cuenta de Stripe con **Clave Secreta** y **Clave Publicable** de prueba.
  * **`ngrok`:** Instalado globalmente o en la carpeta del proyecto. Es **esencial** para probar los pagos.
  * **ImgBB API Key:** Una clave de API de ImgBB (opcional, pero las subidas de avatar fallarán sin ella).



### 1\. Configuración del Backend

1.  **Clona el repositorio:**

    ```bash
    git clone https://github.com/GjuanETH/Harajuku_en_casa.git
    cd Harajuku_en_casa
    ```

2.  **Navega a la carpeta del backend:**

    ```bash
    cd backend
    ```

3.  **Instala las dependencias del backend:**

    ```bash
    npm install
    ```

4.  **Crea un archivo `.env`:**
    En la raíz de la carpeta `backend`, crea un archivo `.env` y añade las siguientes variables:

    ```env
    # Configuración del Servidor y Base de Datos
    MONGO_URI="tu_cadena_de_conexion_mongodb_atlas"
    JWT_SECRET="una_cadena_secreta_fuerte_para_JWT"
    PORT=3000

    # URLs (Asegúrate de que NO terminen con una /)
    CORS_ORIGIN="http://localhost:5173"
    FRONTEND_URL="http://localhost:5173"
    BACKEND_URL="https://[TU_URL_DE_NGROK].ngrok.io" # ¡Espera al paso de ngrok!

    # Claves de APIs
    IMGBB_API_KEY="tu_clave_api_imgbb"
    STRIPE_SECRET_KEY="sk_test_... (Tu clave secreta de Stripe)"
    STRIPE_WEBHOOK_SECRET="whsec_... (Tu secreto de webhook de Stripe)"
    ```

      * **¡Importante\!** Deja `BACKEND_URL` y `STRIPE_WEBHOOK_SECRET` vacíos por ahora. Los obtendrás en el siguiente paso.


### 2\. Configuración de `ngrok` y Webhook de Stripe

Este es el paso más importante para que funcionen los pagos. **Debes hacerlo ANTES de iniciar el servidor backend.**

1.  **Abre una nueva terminal** en la carpeta de tu proyecto.
2.  **Inicia `ngrok`** para exponer el puerto de tu backend (3000):
    ```bash
    ngrok http 3000
    # O si lo tienes en la carpeta: ./ngrok http 3000
    ```
3.  `ngrok` te dará una URL pública. Cópiala (ej. `https://elective-joleen.ngrok.free.dev`).
4.  **Actualiza tu `.env` del backend:** Pega esa URL en la variable `BACKEND_URL`.
5.  **Ve a tu Dashboard de Stripe:**
      * Ve a `Desarrolladores` \> `Webhooks` \> `+ Agregar destino`.
      * **URL del destino:** Pega tu URL de `ngrok` + la ruta del webhook:
        `https://[TU_URL_DE_NGROK].ngrok.io/api/payment/stripe-webhook`
      * **Eventos:** Haz clic en `+ Seleccionar eventos` y añade:
          * `payment_intent.succeeded`
          * `payment_intent.payment_failed`
      * Haz clic en `Crear destino`.
6.  **Obtén el Secreto:** En la página de confirmación del webhook, haz clic en **"Revelar"** bajo **"Secreto de firma"**.
7.  **Actualiza tu `.env` del backend:** Copia el secreto (`whsec_...`) y pégalo en la variable `STRIPE_WEBHOOK_SECRET`.



### 3\. Configuración del Frontend

1.  **Abre una tercera terminal.**
2.  **Navega a la carpeta del frontend:**
    ```bash
    cd .. 
    cd frontend # (o el nombre de tu carpeta de frontend)
    ```
3.  **Instala las dependencias:**
    ```bash
    npm install
    ```
4.  **Crea un archivo `.env` (en el frontend):**
    En la raíz de la carpeta `frontend`, crea un archivo `.env` y añade tus variables **públicas**:
    ```env
    VITE_API_BASE_URL="http://localhost:3000/api"
    VITE_STRIPE_PUBLIC_KEY="pk_test_... (Tu clave publicable de Stripe)"
    ```
      * **NOTA:** Tu `CheckoutPage.jsx` debe ser actualizada para leer la clave desde `import.meta.env.VITE_STRIPE_PUBLIC_KEY` en lugar de tenerla hardcodeada.


### 4\. ¡Ejecutar Todo\!

Ahora tienes 3 terminales listas:

  * **Terminal 1 (ngrok):** Debería estar corriendo.
    ```bash
    ngrok http 3000
    ```
  * **Terminal 2 (Backend):** Inicia el servidor (después de llenar el `.env` con las claves de `ngrok` y `Stripe`).
    ```bash
    cd backend
    node server.js
    ```
      * *Verás los logs: `🚀 Servidor backend corriendo...`, `✅ Conectado a MongoDB...`, `💳 STRIPE_SECRET_KEY: SET`, etc.*
  * **Terminal 3 (Frontend):** Inicia la aplicación de React.
    ```bash
    cd frontend
    npm run dev
    ```

Abre `http://localhost:5173` en tu navegador. ¡Ahora "Harajuku en Casa" está funcionando completamente, incluyendo los pagos\!

## 📝 Autores

  * **Juan David Gutiérrez Reyes**
  * **Sofía Ortiz Daza**
