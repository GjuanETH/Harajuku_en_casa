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
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    // --- ¡NUEVO CAMPO PARA EL CARRITO! ---
    cart: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId, // Guardará el ID del producto
                ref: 'Product' // Hace referencia a nuestro modelo 'Product'
            },
            quantity: {
                type: Number,
                required: true,
                min: 1,
                default: 1
            }
        }
    ]
});


// --- ¡NUEVO! CREAR EL ESQUEMA Y MODELO DE PRODUCTO ---
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String, required: true }, // URL de la imagen
    brand: { type: String }
});

const Product = mongoose.model('Product', productSchema);

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
// --- MIDDLEWARE DE AUTENTICACIÓN (VERSIÓN DE DEPURACIÓN) ---
function authenticateToken(req, res, next) {
    console.log("\n--- Verificando token ---");
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log("Token recibido del frontend:", token);

    if (token == null) {
        console.log("Acceso denegado: No se proporcionó token.");
        return res.sendStatus(401); // No autorizado
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, Payload) => {
        if (err) {
            // Si el token no es válido, nos dirá por qué.
            console.error("¡ERROR DE TOKEN! El token no es válido:", err.message);
            return res.sendStatus(403); // Prohibido
        }
        console.log("Token verificado exitosamente. Payload:", Payload);
        req.user = Payload; // Guardamos el payload en req.user
        next(); // ¡Dejamos pasar a la siguiente función!
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
        const payload =  { email: user.email };
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

// --- RUTA PROTEGIDA PARA SINCRONIZAR EL CARRITO (VERSIÓN DE DEPURACIÓN) ---
app.post('/api/cart/sync', authenticateToken, async (req, res) => {
    console.log("\n--- INICIANDO SYNC DE CARRITO ---");
    try {
        const localCart = req.body.cart || [];
        console.log("1. Carrito local recibido del frontend:", JSON.stringify(localCart, null, 2));

        if (!req.user || !req.user.email) {
            return res.status(400).json({ message: "Payload del token inválido." });
        }
        console.log("2. Usuario identificado por token:", req.user.email);

        const user = await User.findOne({ email: req.user.email });

        if (!user) {
            console.log("3. ERROR: Usuario no encontrado en la BD.");
            return res.status(404).json({ message: "Usuario no encontrado." });
        }
        console.log("3. Usuario encontrado en la BD. Carrito actual:", JSON.stringify(user.cart, null, 2));

        // Lógica de fusión
        localCart.forEach(localItem => {
            const productId = localItem._id;
            console.log(`4. Procesando item local: ${localItem.name} (ID: ${productId})`);

            const dbItemIndex = user.cart.findIndex(dbItem => 
                dbItem.product && dbItem.product.toString() === productId
            );

            if (dbItemIndex > -1) {
                console.log(`   -> El producto ya existe. Aumentando cantidad.`);
                user.cart[dbItemIndex].quantity += localItem.quantity;
            } else {
                console.log(`   -> El producto es nuevo. Añadiendo al carrito.`);
                user.cart.push({
                    product: productId,
                    quantity: localItem.quantity
                });
            }
        });

        console.log("5. Carrito del usuario DESPUÉS de la fusión:", JSON.stringify(user.cart, null, 2));
        
        console.log("6. Marcando 'cart' como modificado...");
        user.markModified('cart');
        
        console.log("7. Intentando guardar los cambios...");
        await user.save();
        console.log("8. ¡Cambios guardados exitosamente en la BD!");

        const populatedUser = await User.findOne({ email: req.user.email }).populate('cart.product');
        console.log("9. Devolviendo carrito poblado al frontend.");
        res.status(200).json(populatedUser.cart);

    } catch (error) {
        console.error("--- ¡ERROR CATASTRÓFICO EN EL SYNC! ---:", error);
        res.status(500).json({ message: "Error en el servidor." });
    }
});

// --- ¡NUEVA RUTA PARA OBTENER PRODUCTOS! ---
app.get('/api/products', async (req, res) => {
    try {
        // Buscamos todos los documentos en la colección de Productos
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({ message: "Error en el servidor." });
    }
});

// 5. Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});