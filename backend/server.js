// 1. Importar los paquetes que necesitamos
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const multer = require('multer');
const axios = require('axios');
require('dotenv').config(); // Cargar variables de entorno

// 2. Crear la aplicación de Express
const app = express();
// PUERTO RESTAURADO A 3000 SEGÚN TU SOLICITUD
const PORT = process.env.PORT || 3000;

// Verificar que las variables de entorno críticas existan ANTES de iniciar el servidor
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
// CORS_ORIGIN ahora debe apuntar a donde esté tu frontend, por ejemplo, 5173 para Vite o 3000 para React por defecto
// Si tu frontend corre en http://localhost:5173 (común con Vite), asegúrate de que tu .env tenga CORS_ORIGIN=http://localhost:5173
// Si tu frontend corre en http://localhost:3000 (común con Create React App), CORS_ORIGIN=http://localhost:3000
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173'; // Default para frontend de ejemplo con Vite, ajústalo según tu frontend

if (!MONGO_URI) {
    console.error("❌ ERROR CRÍTICO: MONGO_URI no está definida en el archivo .env.");
    process.exit(1); // Sale de la aplicación si falta la URI de MongoDB
}

if (!JWT_SECRET) {
    console.error("❌ ERROR CRÍTICO: JWT_SECRET no está definida en el archivo .env.");
    process.exit(1); // Sale de la aplicación si no hay clave JWT
}

if (!IMGBB_API_KEY) {
    console.warn("⚠️ ADVERTENCIA: IMGBB_API_KEY no está definida en el archivo .env. La subida de avatares no funcionará.");
}


// Conexión a MongoDB Atlas
mongoose.connect(MONGO_URI) // Eliminadas opciones deprecated, Mongoose 6+ ya no las necesita y las ignora
    .then(() => console.log("✅ Conectado a MongoDB Atlas exitosamente."))
    .catch(err => {
        console.error("❌ ERROR al conectar a MongoDB:", err);
        process.exit(1); // Sale de la aplicación si la conexión a MongoDB falla
    });

// --- ESQUEMA Y MODELO DE USUARIO ---
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    cart: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1,
                default: 1
            }
        }
    ],
    wishlist: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        }
    ],
    profile: {
        name: { type: String },
        bio: { type: String, default: 'Amante de la moda japonesa.' },
        location: { type: String, default: 'Un lugar kawaii' },
        avatar: { type: String, default: 'https://i.ibb.co/Vt2L0Qh/yuki-tanaka-avatar.png' },
        stylePreferences: [{ type: String }]
    }
});

userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

// --- ESQUEMA Y MODELO DE PRODUCTO ---
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    imageUrl: { type: String, required: true },
    stock: { type: Number, required: true, default: 0 },
    brand: { type: String }
});

const Product = mongoose.model('Product', productSchema);

// --- ESQUEMA Y MODELO DE ORDEN (PEDIDO) ---
const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            productName: {
                type: String,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            imageUrl: {
                type: String,
                required: true
            }
        }
    ],
    total: {
        type: Number,
        required: true
    },
    shippingAddress: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: false },
        zipCode: { type: String, required: true },
        country: { type: String, required: true }
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    orderNumber: {
        type: String,
        unique: true,
        sparse: true
    }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);


// Configuración de Multer para la subida de avatares
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos de imagen.'), false);
        }
    }
});


// 3. Configurar los Middlewares
app.use(cors({
    origin: CORS_ORIGIN,
    credentials: true,
}));
app.use(express.json());

// Servir archivos estáticos (imágenes si las guardas localmente)
app.use('/Imagenes', express.static('Imagenes'));

// --- MIDDLEWARE DE AUTENTICACIÓN ---
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: "No autorizado: Token no proporcionado." });
    }

    jwt.verify(token, JWT_SECRET, (err, payload) => { // Usar la constante JWT_SECRET
        if (err) {
            const status = err.name === 'TokenExpiredError' ? 401 : 403;
            return res.status(status).json({ message: "No autorizado: Token inválido o expirado." });
        }
        req.user = payload;
        next();
    });
}

// --- MIDDLEWARE DE AUTORIZACIÓN ---
function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: "Acceso denegado: Rol de usuario no especificado." });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Acceso denegado: No tienes permiso para realizar esta acción." });
        }
        next();
    };
}


// 4. Definir las Rutas de la API

// --- RUTAS PÚBLICAS ---

app.get('/api/test', (req, res) => {
    res.json({ message: "¡Conexión con el backend exitosa! ✨" });
});

// Ruta para registrar un nuevo usuario
app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        const userExists = await User.findOne({ email: email });
        if (userExists) {
            return res.status(400).json({ message: "El correo ya está registrado." });
        }

        let initialName = email.split('@')[0];
        initialName = initialName.charAt(0).toUpperCase() + initialName.slice(1);

        const newUser = new User({
            email: email,
            password: password,
            profile: {
                name: initialName,
            }
        });
        await newUser.save();

        const payload = { id: newUser._id, email: newUser.email, role: newUser.role };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // Usar la constante JWT_SECRET

        res.status(201).json({
            message: "Usuario registrado exitosamente.",
            token: token,
            userEmail: newUser.email,
            userRole: newUser.role,
            userName: newUser.profile.name
        });
    } catch (error) {
        console.error("Error en el registro:", error);
        res.status(500).json({ message: "Error en el servidor al registrar usuario." });
    }
});

// Ruta para iniciar sesión
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(400).json({ message: "Correo o contraseña inválidos." });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Correo o contraseña inválidos." });
        }

        const payload = { id: user._id, email: user.email, role: user.role };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // Usar la constante JWT_SECRET

        res.status(200).json({
            message: "Inicio de sesión exitoso. ¡Bienvenid@!",
            token: token,
            userEmail: user.email,
            userRole: user.role,
            userName: user.profile.name
        });
    } catch (error) {
        console.error("Error en el login:", error);
        res.status(500).json({ message: "Error en el servidor al iniciar sesión." });
    }
});

// Ruta para obtener todos los productos (pública para el catálogo)
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({ message: "Error en el servidor al obtener productos." });
    }
});

// --- RUTA TEMPORAL PARA AÑADIR PRODUCTOS DE EJEMPLO (SOLO PARA DESARROLLO) ---
// La he movido aquí para que sea más fácil de encontrar y se pueda comentar/eliminar
// más fácilmente una vez que tengas tus propios datos o un sistema de importación.
const generateSampleProducts = () => {
    return [
        {
            name: "Camiseta Anime Kawaii",
            description: "Camiseta de algodón con estampado de personaje de anime kawaii. ¡Perfecta para cualquier fan!",
            price: 24.99,
            category: "Ropa",
            imageUrl: "https://i.ibb.co/L5rK3y0/camiseta-anime-kawaii.png",
            stock: 50,
            brand: "HarajukuThreads"
        },
        {
            name: "Sudadera Pastel Goth",
            description: "Sudadera oversize estilo pastel goth con detalles bordados. Comodidad y estilo único.",
            price: 45.00,
            category: "Ropa",
            imageUrl: "https://i.ibb.co/D85LhJ7/sudadera-pastel-goth.png",
            stock: 30,
            brand: "ShadowBloom"
        },
        {
            name: "Peluche Totoro Gigante",
            description: "Adorable peluche de Totoro de 80cm. ¡El compañero perfecto para tus noches de película!",
            price: 59.99,
            category: "Juguetes",
            imageUrl: "https://i.ibb.co/hKq9wS4/peluche-totoro.png",
            stock: 15,
            brand: "GhibliDreams"
        },
        {
            name: "Anillo Plata Kero",
            description: "Anillo ajustable de plata 925 con diseño de Kero de Card Captor Sakura.",
            price: 18.50,
            category: "Accesorios",
            imageUrl: "https://i.ibb.co/Rg90G0j/anillo-kero.png",
            stock: 40,
            brand: "SakuraJewels"
        },
        {
            name: "Mochila Sailor Moon",
            description: "Mochila de piel sintética con diseño clásico de Sailor Moon. Ideal para el día a día.",
            price: 39.99,
            category: "Accesorios",
            imageUrl: "https://i.ibb.co/g42Jz6b/mochila-sailor-moon.png",
            stock: 25,
            brand: "MoonPrincess"
        },
        {
            name: "Figura Nendoroid Hatsune Miku",
            description: "Figura coleccionable Nendoroid de Hatsune Miku con accesorios intercambiables.",
            price: 75.00,
            category: "Juguetes",
            imageUrl: "https://i.ibb.co/R42YyGq/nendoroid-miku.png",
            stock: 10,
            brand: "GoodSmile"
        }
    ];
};

app.post('/api/seed-products', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        await Product.deleteMany({});
        const sampleProducts = generateSampleProducts();
        await Product.insertMany(sampleProducts);
        res.status(201).json({ message: "Productos de ejemplo añadidos exitosamente." });
    } catch (error) {
        console.error("Error al añadir productos de ejemplo:", error);
        res.status(500).json({ message: "Error en el servidor al añadir productos de ejemplo." });
    }
});


// --- RUTAS PROTEGIDAS PARA USUARIOS AUTENTICADOS (y admins) ---

// Ruta para obtener el perfil completo del usuario
app.get('/api/perfil', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password -cart')
            .populate('wishlist');

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        res.json({
            message: "Bienvenido a tu perfil.",
            userData: {
                id: user._id,
                email: user.email,
                role: user.role,
                profile: user.profile,
                wishlist: user.wishlist
            }
        });
    } catch (error) {
        console.error("Error al obtener perfil:", error);
        res.status(500).json({ message: "Error en el servidor al obtener perfil." });
    }
});

// *** NUEVO ENDPOINT: Obtener los pedidos de un usuario específico ***
app.get('/api/orders/user', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userOrders = await Order.find({ user: userId }).sort({ createdAt: -1 });

        res.status(200).json(userOrders);
    } catch (error) {
        console.error("Error al obtener los pedidos del usuario:", error);
        res.status(500).json({ message: "Error en el servidor al obtener pedidos del usuario." });
    }
});

// *** MODIFICACIÓN IMPORTANTE: Para crear un pedido (desde ConfirmationPage) ***
app.post('/api/orders', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userEmail = req.user.email;
        const { items, total, shippingAddress } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'El pedido debe contener al menos un artículo.' });
        }

        for (const item of items) {
            if (!mongoose.Types.ObjectId.isValid(item.productId)) {
                return res.status(400).json({ message: `ID de producto inválido en el carrito: ${item.productId}` });
            }

            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ message: `Producto no encontrado: ${item.productName}.` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ message: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Pedido: ${item.quantity}.` });
            }
        }

        const orderNumber = `HJC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const newOrder = new Order({
            user: userId,
            userEmail: userEmail,
            items: items.map(item => ({
                productId: item.productId,
                productName: item.productName,
                price: item.price,
                quantity: item.quantity,
                imageUrl: item.imageUrl
             })),
            total: total,
            shippingAddress: shippingAddress,
            status: 'pending',
            orderNumber: orderNumber
        });

        await newOrder.save();

        for (const item of items) {
            await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
        }

        const user = await User.findById(userId);
        if (user) {
            user.cart = [];
            await user.save();
        }

        res.status(201).json({
            message: "Pedido creado exitosamente.",
            order: newOrder,
            orderNumber: newOrder.orderNumber,
            total: newOrder.total,
            items: newOrder.items
        });

    } catch (error) {
        console.error("Error al crear pedido:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message, errors: error.errors });
        }
        res.status(500).json({ message: "Error en el servidor al crear el pedido." });
    }
});

// *** NUEVO ENDPOINT: Cancelar un pedido ***
app.delete('/api/orders/:orderId', authenticateToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'ID de pedido inválido.' });
        }

        const order = await Order.findOne({ _id: orderId, user: userId });

        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado o no autorizado.' });
        }

        if (order.status === 'delivered' || order.status === 'cancelled' || order.status === 'shipped') {
            return res.status(400).json({ message: `No se puede cancelar un pedido en estado "${order.status}".` });
        }

        order.status = 'cancelled';
        await order.save();

        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
        }

        res.status(200).json({ message: 'Pedido cancelado exitosamente.', orderId: order._id, newStatus: order.status });

    } catch (error) {
        console.error('Error al cancelar el pedido:', error);
        res.status(500).json({ message: 'Error interno del servidor al cancelar el pedido.' });
    }
});


// *** NUEVO ENDPOINT: Obtener toda la wishlist del usuario ***
app.get('/api/wishlist', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('wishlist');
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        res.status(200).json(user.wishlist);
    } catch (error) {
        console.error('Error al obtener la lista de deseos:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener la lista de deseos.' });
    }
});

// *** CAMBIO DE RUTA: Añadir a la wishlist ***
app.post('/api/wishlist/:productId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const productId = req.params.productId;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'ID de producto inválido.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const wishlistIds = new Set(user.wishlist.map(id => id.toString()));

        if (wishlistIds.has(productId)) {
            return res.status(409).json({ message: 'El producto ya está en la lista de deseos.' });
        }

        user.wishlist.push(productId);
        await user.save();

        const populatedUser = await User.findById(userId).populate('wishlist');
        res.status(200).json({ message: 'Producto añadido a la lista de deseos.', wishlist: populatedUser.wishlist });

    } catch (error) {
        console.error('Error al añadir a la lista de deseos:', error);
        res.status(500).json({ message: 'Error interno del servidor al añadir a la lista de deseos.' });
    }
});

// *** CAMBIO DE RUTA: Eliminar de la wishlist ***
app.delete('/api/wishlist/:productId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const productId = req.params.productId;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'ID de producto inválido.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const initialLength = user.wishlist.length;
        user.wishlist = user.wishlist.filter(item => item.toString() !== productId);

        if (user.wishlist.length === initialLength) {
            return res.status(404).json({ message: 'El producto no se encontró en la lista de deseos.' });
        }

        await user.save();
        res.status(200).json({ message: 'Producto eliminado de la lista de deseos.', wishlist: user.wishlist });

    } catch (error) {
        console.error('Error al eliminar de la lista de deseos:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar de la lista de deseos.' });
    }
});

// Ruta para subir y actualizar avatar
app.post('/api/upload-avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No se subió ningún archivo." });
        }

        if (!IMGBB_API_KEY) { // Usar la constante IMGBB_API_KEY
            return res.status(500).json({ message: "Configuración de API Key de ImgBB faltante en el servidor." });
        }

        const base64Image = Buffer.from(req.file.buffer).toString('base64');

        const params = new URLSearchParams();
        params.append('key', IMGBB_API_KEY); // Usar la constante IMGBB_API_KEY
        params.append('image', base64Image);

        const imgbbResponse = await axios.post('https://api.imgbb.com/1/upload', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const imageUrl = imgbbResponse.data.data.url;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        if (!user.profile) {
            user.profile = {};
        }
        user.profile.avatar = imageUrl;
        await user.save();

        res.status(200).json({ message: "Avatar actualizado exitosamente.", avatarUrl: imageUrl });

    } catch (error) {
        console.error("Error al subir avatar:", error.response ? error.response.data : error.message);
        res.status(500).json({ message: "Error en el servidor al subir el avatar." });
    }
});


// Ruta para actualizar el perfil del usuario (sin el avatar)
app.put('/api/perfil', authenticateToken, async (req, res) => {
    try {
        const { name, bio, location, stylePreferences } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        if (!user.profile) {
            user.profile = {};
        }

        if (name !== undefined) user.profile.name = name;
        if (bio !== undefined) user.profile.bio = bio;
        if (location !== undefined) user.profile.location = location;
        if (stylePreferences !== undefined) user.profile.stylePreferences = stylePreferences;

        await user.save();

        res.status(200).json({ message: "Perfil actualizado exitosamente.", profile: user.profile });
    } catch (error) {
        console.error("Error al actualizar el perfil:", error);
        res.status(500).json({ message: "Error en el servidor al actualizar el perfil." });
    }
});

// Rutas del carrito
app.get('/api/cart', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('cart.product');
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }
        user.cart = user.cart.filter(item => item.product !== null && item.product !== undefined);
        await user.save();

        res.status(200).json(user.cart);
    } catch (error) {
        console.error("Error al obtener el carrito:", error);
        res.status(500).json({ message: "Error en el servidor al obtener carrito." });
    }
});

// Sincronizar el carrito del frontend con el backend (para login, etc.)
app.post('/api/cart/sync', authenticateToken, async (req, res) => {
    try {
        const localCart = req.body.cart || [];
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        const validCartItems = [];
        for (const item of localCart) {
            if (mongoose.Types.ObjectId.isValid(item._id)) {
                const product = await Product.findById(item._id);
                if (product) {
                    validCartItems.push({ product: item._id, quantity: item.quantity });
                } else {
                    console.warn(`Producto ${item._id} no encontrado, se omitirá del carrito al sincronizar.`);
                }
            } else {
                console.warn(`ID de producto inválido ${item._id}, se omitirá del carrito al sincronizar.`);
            }
        }

        user.cart = validCartItems;
        user.markModified('cart');
        await user.save();

        const populatedUser = await User.findById(userId).populate('cart.product');
        res.status(200).json(populatedUser.cart);

    } catch (error) {
        console.error("Error al sincronizar el carrito:", error);
        res.status(500).json({ message: "Error en el servidor al sincronizar carrito." });
    }
});

app.post('/api/cart/add', authenticateToken, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'ID de producto inválido.' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "Usuario no encontrado." });

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "Producto no encontrado." });
        if (product.stock < quantity) {
            return res.status(400).json({ message: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}.` });
        }

        const itemIndex = user.cart.findIndex(item => item.product && item.product.toString() === productId);

        if (itemIndex > -1) {
            if (product.stock < (user.cart[itemIndex].quantity + quantity)) {
                return res.status(400).json({ message: `No hay suficiente stock para añadir ${quantity} unidades más de ${product.name}.` });
            }
            user.cart[itemIndex].quantity += quantity;
        } else {
            user.cart.push({ product: productId, quantity: quantity });
        }

        user.markModified('cart');
        await user.save();

        const populatedUser = await User.findById(req.user.id).populate('cart.product');
        res.status(200).json(populatedUser.cart);

    } catch (error) {
        console.error("Error al añadir producto al carrito:", error);
        res.status(500).json({ message: "Error en el servidor al añadir al carrito." });
    }
});

app.post('/api/cart/update', authenticateToken, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'ID de producto inválido.' });
        }
        if (typeof quantity !== 'number' || quantity < 0) {
            return res.status(400).json({ message: 'Cantidad inválida.' });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "Producto no encontrado." });

        if (quantity > product.stock) {
            return res.status(400).json({ message: `No hay suficiente stock para ${product.name}. Disponible: ${product.stock}.` });
        }

        const itemIndex = user.cart.findIndex(item => item.product && item.product.toString() === productId);

        if (itemIndex > -1) {
            if (quantity === 0) {
                user.cart.splice(itemIndex, 1);
            } else {
                user.cart[itemIndex].quantity = quantity;
            }

            user.markModified('cart');
            await user.save();

            const populatedUser = await User.findById(req.user.id).populate('cart.product');
            return res.status(200).json(populatedUser.cart);
        } else {
            return res.status(404).json({ message: "Producto no encontrado en el carrito." });
        }

    } catch (error) {
        console.error("Error al actualizar producto en el carrito:", error);
        res.status(500).json({ message: "Error en el servidor al actualizar carrito." });
    }
});

app.delete('/api/cart/remove/:productId', authenticateToken, async (req, res) => {
    try {
        const { productId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'ID de producto inválido.' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "Usuario no encontrado." });

        const initialLength = user.cart.length;
        user.cart = user.cart.filter(item => item.product && item.product.toString() !== productId);

        if (user.cart.length === initialLength) {
            return res.status(404).json({ message: 'El producto no se encontró en el carrito.' });
        }

        user.markModified('cart');
        await user.save();

        const populatedUser = await User.findById(req.user.id).populate('cart.product');
        res.status(200).json(populatedUser.cart);

    } catch (error) {
        console.error("Error al eliminar producto del carrito:", error);
        res.status(500).json({ message: "Error en el servidor al eliminar del carrito." });
    }
});


// --- RUTAS PROTEGIDAS SOLO PARA ADMINISTRADORES ---

// Obtener un producto por ID (para admins, aunque ya hay una pública)
app.get('/api/admin/products/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const productId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'ID de producto inválido' });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: "Producto no encontrado." });
        }

        res.status(200).json(product);
    } catch (error) {
        console.error("BACKEND ERROR: Error al obtener producto por ID (Admin):", error);
        res.status(500).json({ message: "Error en el servidor al obtener el producto." });
    }
});


app.post('/api/admin/products', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { name, description, price, category, imageUrl, stock, brand } = req.body;
        const newProduct = new Product({ name, description, price, category, imageUrl, stock, brand });
        await newProduct.save();
        res.status(201).json({ message: "Producto creado exitosamente.", product: newProduct });
    } catch (error) {
        console.error("Error al crear producto:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message, errors: error.errors });
        }
        res.status(500).json({ message: "Error en el servidor al crear producto." });
    }
});

app.put('/api/admin/products/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de producto inválido' });
        }
        const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!updatedProduct) {
            return res.status(404).json({ message: "Producto no encontrado." });
        }
        res.status(200).json({ message: "Producto actualizado exitosamente.", product: updatedProduct });
    } catch (error) {
        console.error("Error al actualizar producto:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message, errors: error.errors });
        }
        res.status(500).json({ message: "Error en el servidor al actualizar producto." });
    }
});

app.delete('/api/admin/products/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const productId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'ID de producto inválido' });
        }

        const result = await Product.findByIdAndDelete(productId);

        if (!result) {
            return res.status(404).json({ message: "Producto no encontrado." });
        }

        res.status(200).json({ message: "Producto eliminado exitosamente." });

    } catch (error) {
        console.error("BACKEND ERROR: Error al eliminar producto por ID:", error);
        res.status(500).json({ message: "Error en el servidor al eliminar el producto." });
    }
});

// --- RUTAS DE GESTIÓN DE USUARIOS (Solo Admin) ---
app.get('/api/admin/users', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json(users);
    } catch (error) {
        console.error("Error al obtener usuarios (Admin):", error);
        res.status(500).json({ message: "Error en el servidor al obtener usuarios." });
    }
});

app.put('/api/admin/users/:id/role', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de usuario inválido.' });
        }

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: "Rol inválido proporcionado." });
        }

        if (req.user.id === id.toString() && role !== 'admin') {
            return res.status(403).json({ message: "No puedes cambiar tu propio rol de administrador." });
        }

        const targetUser = await User.findById(id);
        if (targetUser && targetUser.role === 'admin' && req.user.id !== id.toString()) {
            if (role === 'user') {
                return res.status(403).json({ message: "No puedes degradar a otro administrador." });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true }).select('-password');
        if (!updatedUser) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }
        res.status(200).json({ message: "Rol de usuario actualizado.", user: updatedUser });
    } catch (error) {
        console.error("Error al actualizar rol de usuario:", error);
        res.status(500).json({ message: "Error en el servidor al actualizar rol." });
    }
});

app.delete('/api/admin/users/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de usuario inválido.' });
        }

        if (req.user.id === id.toString()) {
            return res.status(403).json({ message: "No puedes eliminar tu propia cuenta de administrador." });
        }

        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }
        res.status(200).json({ message: "Usuario eliminado exitosamente." });
    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        res.status(500).json({ message: "Error en el servidor al eliminar usuario." });
    }
});


// --- RUTAS DE GESTIÓN DE PEDIDOS (Solo Admin) ---
// Obtener todos los pedidos (para admins)
app.get('/api/admin/orders', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const orders = await Order.find().populate('user', 'email profile.name').sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error al obtener pedidos (Admin):", error);
        res.status(500).json({ message: "Error en el servidor al obtener pedidos." });
    }
});

// Obtener un pedido por ID (para admins)
app.get('/api/admin/orders/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const orderId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'ID de pedido inválido.' });
        }

        const order = await Order.findById(orderId)
            .populate('user', 'email profile.name');
        if (!order) {
            return res.status(404).json({ message: "Pedido no encontrado." });
        }
        res.status(200).json(order);
    } catch (error) {
        console.error("Error al obtener pedido por ID (Admin):", error);
        res.status(500).json({ message: "Error en el servidor al obtener pedido." });
    }
});

// Actualizar el estado de un pedido (para admins)
app.put('/api/admin/orders/:id/status', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de pedido inválido.' });
        }

        if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: "Estado de pedido inválido." });
        }

        const updatedOrder = await Order.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
        if (!updatedOrder) {
            return res.status(404).json({ message: "Pedido no encontrado." });
        }
        res.status(200).json({ message: "Estado del pedido actualizado.", order: updatedOrder });
    } catch (error) {
        console.error("Error al actualizar estado del pedido (Admin):", error);
        res.status(500).json({ message: "Error en el servidor al actualizar estado del pedido." });
    }
});


// 5. Manejador de errores para rutas no encontradas (404)
app.use((req, res, next) => {
    const error = new Error('Ruta no encontrada');
    error.statusCode = 404;
    next(error);
});

// 6. Manejador de errores general (500)
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (res.headersSent) {
        return next(err);
    }
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        message: err.message || "Algo salió mal en el servidor.",
        error: process.env.NODE_ENV === 'production' ? {} : err.stack
    });
});


// 7. Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
    console.log(`🌐 CORS_ORIGIN: ${CORS_ORIGIN}`);
    console.log(`🔑 JWT_SECRET: ${JWT_SECRET ? 'SET' : 'NOT SET'}`);
    console.log(`📦 MONGO_URI: ${MONGO_URI ? 'SET' : 'NOT SET'}`);
    console.log(`🖼️ IMGBB_API_KEY: ${IMGBB_API_KEY ? 'SET' : 'NOT SET'}`);
});