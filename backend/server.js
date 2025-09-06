// 1. Importar los paquetes que necesitamos
const express = require('express');
const cors = require('cors'); // Importamos cors
const bcrypt = require('bcrypt'); // Importamos bcrypt para el hashing de contraseñas
const jwt = require('jsonwebtoken'); // Importamos jsonwebtoken
const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' }); // Cargar variables de entorno desde .env

// 2. Crear la aplicación de Express
const app = express();
const PORT = 3000; // El puerto para nuestro backend

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Conectado a MongoDB Atlas exitosamente."))
    .catch(err => console.error("Error al conectar a MongoDB:", err));

// ...después de la conexión a MongoDB...

// --- ¡NUEVO! CREAR EL ESQUEMA Y MODELO DE USUARIO ---
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true, // El email es obligatorio
        unique: true,   // No puede haber dos usuarios con el mismo email
        trim: true      // Elimina espacios en blanco al principio y al final
    },
    password: {
        type: String,
        required: true // La contraseña es obligatoria
    }
});

// Creamos el "Modelo" que usaremos para interactuar con la colección de usuarios en la BD
const User = mongoose.model('User', userSchema);
// -----------------------------------------

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("ERROR: JWT_SECRET no está definido en el archivo .env.");
    process.exit(1); // Sale de la aplicación si no hay secreto
}

// 3. Configurar los Middlewares
app.use(cors()); // Usamos cors para permitir peticiones desde el front end
app.use(express.json()); // Para que el servidor entienda datos en formato JSON
// --- NUEVO! MIDDLEWARE DE AUTENTICACIÓN ---
function authenticateToken(req, res, next) {
    // Obtenemos el token del header de la petición.
    // El formato suele ser: "Bearer TOKEN"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // Si no hay token, enviamos un error 401 (No autorizado)
    if (token == null) {
        return res.sendStatus(401);
    }

    // Verificamos el token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            // Si el token no es válido (expiró, fue manipulado, etc.),
            // enviamos un error 403 (Prohibido)
            return res.sendStatus(403);
        }
        // Si el token es válido, guardamos los datos del usuario en la petición
        // y continuamos con la siguiente función (la ruta protegida).
        req.user = user;
        next();
    });
}

// 4. Definir nuestra primera ruta de API (API Endpoint)
// Esta es una ruta de prueba para verificar que la conexión funciona.
app.get('/api/test', (req, res) => {
    // Enviamos una respuesta en formato JSON
    res.json({ message: "¡Conexión con el backend exitosa! ✨" });
});

// Ruta para registrar un nuevo usuario
// --- RUTA DE REGISTRO (ACTUALIZADA CON MONGODB) ---
app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscamos en la base de datos si el usuario ya existe
        const userExists = await User.findOne({ email: email });
        if (userExists) {
            return res.status(400).json({ message: "El correo ya está registrado." });
        }

        // Hasheamos la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Creamos el nuevo usuario usando el modelo y lo guardamos en la BD
        const newUser = new User({
            email: email,
            password: hashedPassword
        });
        await newUser.save(); 

        res.status(201).json({ message: "Usuario registrado exitosamente." });
    } catch (error) {
        console.error("Error en el registro:", error);
        res.status(500).json({ message: "Error en el servidor." });
    }
});

// Ruta para iniciar sesión
// --- RUTA DE LOGIN (ACTUALIZADA CON MONGODB) ---
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscamos al usuario en la base de datos por su email
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(400).json({ message: "Correo o contraseña inválidos." });
        }

        // Comparamos la contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Correo o contraseña inválidos." });
        }

        // Creamos y enviamos el token
        const payload = { user: { email: user.email } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ 
            message: "Inicio de sesión exitoso. ¡Bienvenid@!",
            token: token,
            userEmail: user.email
        });

    } catch (error) {
        console.error("Error en el login:", error);
        res.status(500).json({ message: "Error en el servidor." });
    }
});

// --- ¡NUEVA RUTA PROTEGIDA! ---
// Nota cómo pasamos 'authenticateToken' antes de la lógica principal.
// Ese es nuestro guardia de seguridad en acción.
app.get('/api/perfil', authenticateToken, (req, res) => {
    // Gracias al middleware, ahora tenemos acceso a req.user,
    // que contiene los datos que guardamos en el token (el payload).
    res.json({ 
        message: "Bienvenido a tu perfil secreto.",
        userData: req.user 
    });
});

// 5. Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});