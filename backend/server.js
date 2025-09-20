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

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) {
            // Si el token no es válido, nos dirá por qué.
            console.error("¡ERROR DE TOKEN! El token no es válido:", err.message);
            return res.sendStatus(403); // Prohibido
        }
        console.log("Token verificado exitosamente. Payload:", payload);
        req.user = payload; // Guardamos el payload en req.user
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

// --- RUTA PARA OBTENER EL CARRITO (VERSIÓN FINAL) ---
app.get('/api/cart', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email }).populate('cart.product');
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }
        console.log("Datos del carrito enviados al frontend:", JSON.stringify(user.cart, null, 2));
        res.status(200).json(user.cart);
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor." });
    }
});

// --- RUTA PROTEGIDA PARA SINCRONIZAR EL CARRITO (VERSIÓN FINAL Y SIMPLIFICADA) ---
app.post('/api/cart/sync', authenticateToken, async (req, res) => {
    try {
        const localCart = req.body.cart || [];
        const user = await User.findOne({ email: req.user.email });

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        // LÓGICA DE SINCRONIZACIÓN CORREGIDA:
        // El carrito local del frontend se convierte en la única fuente de verdad.
        // Reemplazamos completamente el carrito de la BD con el que llega del navegador.
        user.cart = localCart.map(item => ({
            product: item._id, // Guardamos solo la referencia al producto
            quantity: item.quantity
        }));

        user.markModified('cart');
        await user.save();

        // Devolvemos el carrito recién guardado y poblado
        const populatedUser = await User.findOne({ email: req.user.email }).populate('cart.product');
        res.status(200).json(populatedUser.cart);

    } catch (error) {
        console.error("Error al sincronizar el carrito:", error);
        res.status(500).json({ message: "Error en el servidor." });
    }
});

// --- RUTA PARA AÑADIR AL CARRITO (VERSIÓN FINAL) ---
app.post('/api/cart/add', authenticateToken, async (req, res) => {
    try {
        const { productId } = req.body;
        const user = await User.findOne({ email: req.user.email });
        if (!user) return res.status(404).json({ message: "Usuario no encontrado." });

        const itemIndex = user.cart.findIndex(item => item.product && item.product.toString() === productId);

        if (itemIndex > -1) {
            user.cart[itemIndex].quantity += 1;
        } else {
            user.cart.push({ product: productId, quantity: 1 });
        }

        user.markModified('cart');
        await user.save();
        
        const populatedUser = await User.findOne({ email: req.user.email }).populate('cart.product');
        console.log("Producto añadido, carrito poblado:", JSON.stringify(populatedUser.cart, null, 2));
        res.status(200).json(populatedUser.cart);

    } catch (error) {
        console.error("Error al añadir producto al carrito:", error);
        res.status(500).json({ message: "Error en el servidor." });
    }
});

// --- RUTA PROTEGIDA PARA ACTUALIZAR LA CANTIDAD DE UN PRODUCTO ---
app.post('/api/cart/update', authenticateToken, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const user = await User.findOne({ email: req.user.email });

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        const itemIndex = user.cart.findIndex(item => item.product.toString() === productId);

        if (itemIndex > -1) {
            // Si la nueva cantidad es 0 o menos, eliminamos el producto
            if (quantity <= 0) {
                user.cart.splice(itemIndex, 1);
            } else {
                // Si no, actualizamos la cantidad
                user.cart[itemIndex].quantity = quantity;
            }

            user.markModified('cart');
            await user.save();

            const populatedUser = await User.findOne({ email: req.user.email }).populate('cart.product');
            return res.status(200).json(populatedUser.cart);
        } else {
            return res.status(404).json({ message: "Producto no encontrado en el carrito." });
        }

    } catch (error) {
        res.status(500).json({ message: "Error en el servidor." });
    }
});

// --- RUTA PROTEGIDA PARA ELIMINAR UN PRODUCTO DEL CARRITO ---
app.delete('/api/cart/remove/:productId', authenticateToken, async (req, res) => {
    try {
        const { productId } = req.params; // Obtenemos el ID de la URL
        const user = await User.findOne({ email: req.user.email });
        if (!user) return res.status(404).json({ message: "Usuario no encontrado." });

        // Filtramos el carrito para quitar el producto
        user.cart = user.cart.filter(item => item.product.toString() !== productId);

        user.markModified('cart');
        await user.save();

        const populatedUser = await User.findOne({ email: req.user.email }).populate('cart.product');
        res.status(200).json(populatedUser.cart);

    } catch (error) {
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