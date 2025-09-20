// 1. Importar los paquetes que necesitamos
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

// 2. Crear la aplicación de Express
const app = express();
const PORT = process.env.PORT || 3000;

// Conexión a MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Conectado a MongoDB Atlas exitosamente."))
    .catch(err => console.error("Error al conectar a MongoDB:", err));

// --- ESQUEMA Y MODELO DE USUARIO ---
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
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    cart: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product'
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

userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

// --- ESQUEMA Y MODELO DE PRODUCTO ---
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    imageUrl: { type: String, required: true }, // <--- CAMBIO: De 'image' a 'imageUrl' para coincidir con el frontend
    stock: { type: Number, required: true, default: 0 }, // <--- ADICIÓN: Campo 'stock'
    brand: { type: String }
});

const Product = mongoose.model('Product', productSchema);

// --- ESQUEMA Y MODELO DE ORDEN (PEDIDO) --- <--- ADICIÓN: Modelo de Orden
const orderSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    userEmail: { // Guardar el email del usuario para referencia fácil
        type: String, 
        required: true 
    }, 
    items: [
        {
            product: { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: 'Product', 
                required: true 
            },
            productName: { // Guardar nombre del producto por si el original cambia
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
            }
        }
    ],
    totalAmount: { 
        type: Number, 
        required: true 
    },
    shippingAddress: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true }
    },
    status: { 
        type: String, 
        enum: ['pending', 'shipped', 'delivered', 'cancelled'], 
        default: 'pending' 
    }
}, { timestamps: true }); // Añade createdAt y updatedAt automáticamente

const Order = mongoose.model('Order', orderSchema);


// --- VERIFICACIÓN DE SECRETO JWT ---
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("ERROR: JWT_SECRET no está definido en el archivo .env.");
    process.exit(1);
}

// 3. Configurar los Middlewares
app.use(cors());
app.use(express.json());

// --- MIDDLEWARE DE AUTENTICACIÓN ---
function authenticateToken(req, res, next) {
    // console.log("\n--- Verificando token ---"); // Puedes descomentar para depurar
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    // console.log("Token recibido del frontend:", token); // Puedes descomentar para depurar

    if (token == null) {
        // console.log("Acceso denegado: No se proporcionó token.");
        return res.status(401).json({ message: "No autorizado: Token no proporcionado." });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) {
            // console.error("¡ERROR DE TOKEN! El token no es válido:", err.message);
            // Si el token expira, enviamos un 401 para que el frontend pueda manejar el logout
            const status = err.name === 'TokenExpiredError' ? 401 : 403;
            return res.status(status).json({ message: "No autorizado: Token inválido o expirado." });
        }
        // console.log("Token verificado exitosamente. Payload:", payload);
        req.user = payload; // Guardamos el payload (que incluye { id, email, role })
        next();
    });
}

// --- MIDDLEWARE DE AUTORIZACIÓN ---
function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            console.warn("Intento de acceso a ruta protegida sin rol definido en el token.");
            return res.status(403).json({ message: "Acceso denegado: Rol de usuario no especificado." });
        }
        
        if (!allowedRoles.includes(req.user.role)) {
            console.warn(`Acceso denegado: Usuario con rol '${req.user.role}' intentó acceder a ruta para roles [${allowedRoles.join(', ')}].`);
            return res.status(403).json({ message: "Acceso denegado: No tienes permiso para realizar esta acción." });
        }
        next();
    };
}


// 4. Definir las Rutas de la API

// --- RUTAS PÚBLICAS ---

// Ruta de prueba
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

        const newUser = new User({ email: email, password: password });
        await newUser.save();

        const payload = { id: newUser._id, email: newUser.email, role: newUser.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({
            message: "Usuario registrado exitosamente.",
            token: token,
            userEmail: newUser.email,
            userRole: newUser.role
        });
    } catch (error) {
        console.error("Error en el registro:", error);
        res.status(500).json({ message: "Error en el servidor." });
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
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            message: "Inicio de sesión exitoso. ¡Bienvenid@!",
            token: token,
            userEmail: user.email,
            userRole: user.role
        });
    } catch (error) {
        console.error("Error en el login:", error);
        res.status(500).json({ message: "Error en el servidor." });
    }
});

// Ruta para obtener todos los productos (pública para el catálogo)
// <--- CAMBIO: Esta ruta ahora no requiere autenticación ni admin, ya que es para el catálogo general.
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({ message: "Error en el servidor." });
    }
});


// --- RUTAS PROTEGIDAS PARA USUARIOS AUTENTICADOS (y admins) ---

// Ruta para el perfil del usuario
app.get('/api/perfil', authenticateToken, async (req, res) => { // <--- ADICIÓN: Buscamos el usuario para devolver más datos si es necesario
    try {
        const user = await User.findById(req.user.id).select('-password -cart'); // No devolver contraseña ni carrito completo aquí
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }
        res.json({
            message: "Bienvenido a tu perfil.",
            userData: {
                id: user._id,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Error al obtener perfil:", error);
        res.status(500).json({ message: "Error en el servidor." });
    }
});

// Rutas del carrito
app.get('/api/cart', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('cart.product');
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }
        res.status(200).json(user.cart);
    } catch (error) {
        console.error("Error al obtener el carrito:", error);
        res.status(500).json({ message: "Error en el servidor al obtener carrito." });
    }
});

app.post('/api/cart/sync', authenticateToken, async (req, res) => {
    try {
        const localCart = req.body.cart || [];
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        user.cart = localCart.map(item => ({
            product: item._id,
            quantity: item.quantity
        }));

        user.markModified('cart');
        await user.save();

        const populatedUser = await User.findById(req.user.id).populate('cart.product');
        res.status(200).json(populatedUser.cart);

    } catch (error) {
        console.error("Error al sincronizar el carrito:", error);
        res.status(500).json({ message: "Error en el servidor al sincronizar carrito." });
    }
});

app.post('/api/cart/add', authenticateToken, async (req, res) => {
    try {
        const { productId } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "Usuario no encontrado." });

        const itemIndex = user.cart.findIndex(item => item.product && item.product.toString() === productId);

        if (itemIndex > -1) {
            user.cart[itemIndex].quantity += 1;
        } else {
            user.cart.push({ product: productId, quantity: 1 });
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
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        const itemIndex = user.cart.findIndex(item => item.product.toString() === productId);

        if (itemIndex > -1) {
            if (quantity <= 0) {
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
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "Usuario no encontrado." });

        user.cart = user.cart.filter(item => item.product.toString() !== productId);

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

// <--- CAMBIO: Las rutas de admin ahora son consistentes con admin.js (usan /api/products/:id)
// Las rutas /api/products están protegidas con authorizeRoles('admin') para estas acciones
// La ruta GET /api/products de arriba sigue siendo pública para el catálogo.

// Ruta para OBTENER UN PRODUCTO por ID (solo admin, para el formulario de edición)
app.get('/api/products/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const productId = req.params.id;
        console.log("BACKEND DEBUG: Recibida petición GET para producto con ID:", productId); // NUEVO LOG

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            console.log("BACKEND DEBUG: ID de producto inválido:", productId); // NUEVO LOG
            return res.status(400).json({ message: 'ID de producto inválido' });
        }
        
        const product = await Product.findById(productId);
        
        if (!product) {
            console.log("BACKEND DEBUG: Producto no encontrado en DB para ID:", productId); // NUEVO LOG
            return res.status(404).json({ message: "Producto no encontrado." });
        }
        
        console.log("BACKEND DEBUG: Producto encontrado:", product); // NUEVO LOG
        res.status(200).json(product);
    } catch (error) {
        console.error("BACKEND ERROR: Error al obtener producto por ID:", error);
        res.status(500).json({ message: "Error en el servidor al obtener el producto." });
    }
});



// Ruta para AÑADIR un nuevo producto (solo admin)
app.post('/api/products', authenticateToken, authorizeRoles('admin'), async (req, res) => { // <--- RUTA CAMBIADA
    try {
        // Asegúrate de que el frontend envía 'imageUrl' y 'stock'
        const { name, description, price, category, imageUrl, stock, brand } = req.body; 
        const newProduct = new Product({ name, description, price, category, imageUrl, stock, brand });
        await newProduct.save();
        res.status(201).json({ message: "Producto creado exitosamente.", product: newProduct });
    } catch (error) {
        console.error("Error al crear producto:", error);
        res.status(500).json({ message: "Error en el servidor al crear producto." });
    }
});

// Ruta para ACTUALIZAR un producto existente (solo admin)
app.put('/api/products/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => { // <--- RUTA CAMBIADA
    try {
        const { id } = req.params;
        const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!updatedProduct) {
            return res.status(404).json({ message: "Producto no encontrado." });
        }
        res.status(200).json({ message: "Producto actualizado exitosamente.", product: updatedProduct });
    } catch (error) {
        console.error("Error al actualizar producto:", error);
        res.status(500).json({ message: "Error en el servidor al actualizar producto." });
    }
});

// Ruta para ELIMINAR un producto (solo admin)
app.delete('/api/products/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const productId = req.params.id;
        console.log("BACKEND DEBUG: Recibida petición DELETE para producto con ID:", productId); // Log de depuración

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            console.log("BACKEND DEBUG: ID de producto inválido para DELETE:", productId); // Log de depuración
            return res.status(400).json({ message: 'ID de producto inválido' });
        }

        const result = await Product.findByIdAndDelete(productId); // Mongoose: Encuentra por ID y elimina

        if (!result) {
            console.log("BACKEND DEBUG: Producto no encontrado para eliminar con ID:", productId); // Log de depuración
            return res.status(404).json({ message: "Producto no encontrado." });
        }
        
        console.log("BACKEND DEBUG: Producto eliminado exitosamente:", productId); // Log de depuración
        res.status(200).json({ message: "Producto eliminado exitosamente." });

    } catch (error) {
        console.error("BACKEND ERROR: Error al eliminar producto por ID:", error);
        res.status(500).json({ message: "Error en el servidor al eliminar el producto." });
    }
});

// --- RUTAS DE GESTIÓN DE USUARIOS (Solo Admin) --- <--- ADICIÓN
// Ruta para obtener todos los usuarios
app.get('/api/users', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const users = await User.find().select('-password'); // No enviar contraseñas
        res.status(200).json(users);
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).json({ message: "Error en el servidor al obtener usuarios." });
    }
});

// Ruta para actualizar el rol de un usuario
app.put('/api/users/:id/role', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: "Rol inválido proporcionado." });
        }

        // Evitar que un admin se cambie su propio rol o se elimine a sí mismo
        if (req.user.id === id.toString() && role !== 'admin') {
            return res.status(403).json({ message: "No puedes cambiar tu propio rol de administrador." });
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

// Ruta para eliminar un usuario
app.delete('/api/users/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        // Prevenir que un admin se elimine a sí mismo
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


// --- RUTAS DE GESTIÓN DE PEDIDOS (Solo Admin) --- <--- ADICIÓN
// Ruta para obtener todos los pedidos
app.get('/api/orders', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const orders = await Order.find().populate('user', 'email').populate('items.product', 'name'); // Popula usuario y nombres de producto
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error al obtener pedidos:", error);
        res.status(500).json({ message: "Error en el servidor al obtener pedidos." });
    }
});

// Ruta para obtener un pedido por ID
app.get('/api/orders/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
                                .populate('user', 'email')
                                .populate('items.product', 'name');
        if (!order) {
            return res.status(404).json({ message: "Pedido no encontrado." });
        }
        res.status(200).json(order);
    } catch (error) {
        console.error("Error al obtener pedido por ID:", error);
        res.status(500).json({ message: "Error en el servidor al obtener pedido." });
    }
});

// Ruta para actualizar el estado de un pedido
app.put('/api/orders/:id/status', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'shipped', 'delivered', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: "Estado de pedido inválido." });
        }

        const updatedOrder = await Order.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
        if (!updatedOrder) {
            return res.status(404).json({ message: "Pedido no encontrado." });
        }
        res.status(200).json({ message: "Estado del pedido actualizado.", order: updatedOrder });
    } catch (error) {
        console.error("Error al actualizar estado del pedido:", error);
        res.status(500).json({ message: "Error en el servidor al actualizar estado del pedido." });
    }
});


// 5. Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});