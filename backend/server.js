// 1. Importar los paquetes que necesitamos
const express = require('express');
const cors = require('cors'); // Importamos cors

// 2. Crear la aplicación de Express
const app = express();
const PORT = 3000; // El puerto para nuestro backend

// 3. Configurar los Middlewares
app.use(cors()); // Usamos cors para permitir peticiones desde el frontend
app.use(express.json()); // Para que el servidor entienda datos en formato JSON

// 4. Definir nuestra primera ruta de API (API Endpoint)
// Esta es una ruta de prueba para verificar que la conexión funciona.
app.get('/api/test', (req, res) => {
    // Enviamos una respuesta en formato JSON
    res.json({ message: "¡Conexión con el backend exitosa! ✨" });
});

// 5. Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});