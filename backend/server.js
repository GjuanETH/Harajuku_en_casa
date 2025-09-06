// 1. Importar los paquetes que necesitamos
const express = require('express');
const cors = require('cors'); // Importamos cors
const bcrypt = require('bcrypt'); // Importamos bcrypt para el hashing de contraseñas
const jwt = require('jsonwebtoken'); // Importamos jsonwebtoken
require('dotenv').config({ path: './.env' }); // Cargar variables de entorno desde .env

// 2. Crear la aplicación de Express
const app = express();
const PORT = 3000; // El puerto para nuestro backend

const users = []; // Array para almacenar usuarios (en memoria de momento)

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("ERROR: JWT_SECRET no está definido en el archivo .env.");
    process.exit(1); // Sale de la aplicación si no hay secreto
}

// 3. Configurar los Middlewares
app.use(cors()); // Usamos cors para permitir peticiones desde el front end
app.use(express.json()); // Para que el servidor entienda datos en formato JSON

// 4. Definir nuestra primera ruta de API (API Endpoint)
// Esta es una ruta de prueba para verificar que la conexión funciona.
app.get('/api/test', (req, res) => {
    // Enviamos una respuesta en formato JSON
    res.json({ message: "¡Conexión con el backend exitosa! ✨" });
});

// Ruta para registrar un nuevo usuario
app.post('/api/register', async (req, res) => {
    try {
        // Extraer email y password del cuerpo de la petición
        const {email, password} = req.body;

        // Verificar si el usuario ya existe
        const userExists = users.find(user => user.email === email);
        if (userExists){
            return res.status(400).json({message: "El correo ya está registrado."});
        }
        // Hashear la contraseña antes de guardarla
        const hashedPassword = await bcrypt.hash(password, 10)

        //Crear el nuevo usuario y guardarlo (en memoria por ahora)
        const newUser = {email, password: hashedPassword};
        users.push(newUser); 

         console.log("Usuarios registrados:", users);

         res.status(201).json({message: "Usuario registrado exitosamente."});
    } catch (error) {
        res.status(500).json({message: "Error en el servidor."});
    }
});

// Ruta para iniciar sesión
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = users.find(u => u.email === email);

        if (!user) {
            return res.status(400).json({ message: "Correo o contraseña inválidos." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Correo o contraseña inválidos." });
        }

        // --- ¡NUEVO: Generar un Token JWT! ---
        // El payload del token es la información que queremos almacenar (ej. id de usuario, email)
        const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '1h' }); // Token válido por 1 hora

        // Enviamos el token al cliente
        res.status(200).json({
            message: "Inicio de sesión exitoso. ¡Bienvenid@!",
            token: token,
            userEmail: user.email // También enviamos el email para mostrarlo en el frontend
        });

    } catch (error) {
        console.error("Error en el login:", error);
        res.status(500).json({ message: "Error en el servidor." });
    }
});

// 5. Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});