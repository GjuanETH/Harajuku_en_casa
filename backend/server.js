// 1. Importar los paquetes que necesitamos
const express = require('express');
const cors = require('cors'); // Importamos cors
const bcrypt = require('bcrypt'); // Importamos bcrypt para el hashing de contraseñas

// 2. Crear la aplicación de Express
const app = express();
const PORT = 3000; // El puerto para nuestro backend

const users = []; // Array para almacenar usuarios (en memoria de momento)

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

app.post('/api/login', async (req, res) => {
    try {
        // 1. Obtenemos el email y la contraseña del cuerpo de la petición
        const { email, password } = req.body;

        // 2. Buscamos al usuario en nuestra base de datos temporal
        const user = users.find(u => u.email === email);
        if (!user) {
            // Si el usuario no se encuentra, enviamos un error genérico por seguridad
            return res.status(400).json({ message: "Correo o contraseña inválidos." });
        }

        // 3. Comparamos la contraseña enviada con la hasheada que tenemos guardada
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            // Si las contraseñas no coinciden, enviamos el mismo error genérico
            return res.status(400).json({ message: "Correo o contraseña inválidos." });
        }

        // 4. Si todo es correcto, el usuario se ha autenticado
        res.status(200).json({ message: "Inicio de sesión exitoso. ¡Bienvenid@!" });

    } catch (error) {
        console.error("Error en el login:", error);
        res.status(500).json({ message: "Error en el servidor." });
    }
});

// 5. Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});