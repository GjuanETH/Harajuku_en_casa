// 1. Importar los paquetes que necesitamos
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const multer = require('multer');
const axios = require('axios');
// --- MODIFICADO: Importar Stripe ---
const stripe = require('stripe');
require('dotenv').config(); // Cargar variables de entorno

// 2. Crear la aplicación de Express
const app = express();
const PORT = process.env.PORT || 3000;

// Verificar que las variables de entorno críticas existan
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// --- AÑADIDO: Variables de Stripe ---
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!MONGO_URI) {
    console.error("❌ ERROR CRÍTICO: MONGO_URI no está definida en el archivo .env.");
    process.exit(1);
}
if (!JWT_SECRET) {
    console.error("❌ ERROR CRÍTICO: JWT_SECRET no está definida en el archivo .env.");
    process.exit(1);
}
if (!IMGBB_API_KEY) {
    console.warn("⚠️ ADVERTENCIA: IMGBB_API_KEY no definida. La subida de avatares no funcionará.");
}

// --- AÑADIDO: Verificación y Configuración de Stripe ---
if (!STRIPE_SECRET_KEY) {
    console.error("❌ ERROR CRÍTICO: STRIPE_SECRET_KEY no está definida. Los pagos no funcionarán.");
    process.exit(1);
}
if (!STRIPE_WEBHOOK_SECRET) {
    console.warn("⚠️ ADVERTENCIA: STRIPE_WEBHOOK_SECRET no está definido. La verificación de webhooks fallará.");
}
// Instanciar Stripe con la clave secreta
const stripeClient = stripe(STRIPE_SECRET_KEY);


// Conexión a MongoDB Atlas
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Conectado a MongoDB Atlas exitosamente."))
    .catch(err => {
        console.error("❌ ERROR al conectar a MongoDB:", err);
        process.exit(1);
    });

// --- ESQUEMAS Y MODELOS ---

// ESQUEMA Y MODELO DE USUARIO
// ... (Tu userSchema completo va aquí, no se modifica) ...
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
    },
    isSilenced: {
        type: Boolean,
        default: false
    },
    silencedUntil: {
        type: Date,
        default: null
    }
}, { timestamps: true });

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

// ESQUEMA Y MODELO DE PRODUCTO
// ... (Tu productSchema completo va aquí, no se modifica) ...
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

// ESQUEMA Y MODELO DE ORDEN (PEDIDO)
// --- MODIFICADO: Adaptado para Stripe ---
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
    },
    // --- CAMPO MODIFICADO ---
    paymentIntentId: { // ID del Payment Intent de Stripe
        type: String,
        unique: true,
        sparse: true
    },
    paymentStatus: { // Estado del pago de Stripe (e.j. 'succeeded')
        type: String
    }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

// ESQUEMAS DE FORO (Report, Comment, Reply, Post)
// ... (Tus esquemas de reportSchema, commentSchema, replySchema, postSchema van aquí, no se modifican) ...
const reportSchema = new mongoose.Schema({
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportedItem: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'onModel'
    },
    onModel: {
        type: String,
        required: true,
        enum: ['Comment', 'Reply', 'Post']
    },
    reason: {
        type: String,
        required: true,
        enum: ['Spam o autopromoción', 'Contenido inapropiado', 'Discurso de odio o acoso', 'Información Falsa o encagañosa', 'Violencia o contenido gráfico','Violación de derechos de autor','Otros (especificar)']
    },
    customReason: {
        type: String,
        trim: true,
        maxlength: 500
    },
    status: {
        type: String,
        enum: ['Pendiente', 'Resuelto', 'Desestimado'],
        default: 'Pendiente'
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolvedAt: {
        type: Date
    },
}, { timestamps: true });
reportSchema.index({ reportedBy: 1, reportedItem: 1 }, { unique: true });
const Report = mongoose.model('Report', reportSchema);

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    dislikes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    hasPendingReports: {
        type: Boolean,
        default: false
    },
    replies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reply'
    }]
}, { timestamps: true });
const Comment = mongoose.model('Comment', commentSchema);

const replySchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        required: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    dislikes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    hasPendingReports: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });
const Reply = mongoose.model('Reply', replySchema);

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment'
        }
    ],
    hasPendingReports: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });
const Post = mongoose.model('Post', postSchema);


// Configuración de Multer
// ... (Tu configuración de Multer va aquí, no se modifica) ...
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

// --- AÑADIDO: WEBHOOK DE STRIPE ---
// Esta ruta debe ir ANTES de `app.use(express.json())` porque Stripe necesita el "body" en formato raw.
app.post('/api/payment/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
    console.log("🔔 Webhook de Stripe recibido.");
    const sig = req.headers['stripe-signature'];

    let event;

    try {
        event = stripeClient.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
        console.log("Webhook verificado exitosamente.");
    } catch (err) {
        console.error(`❌ Error en la verificación del webhook: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Manejar el evento
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log(`✅ PaymentIntent ${paymentIntent.id} fue exitoso.`);
            
            try {
                // Recuperar los datos que guardamos en el metadata
                const metadata = paymentIntent.metadata.cart;
                if (!metadata) {
                    throw new Error("No se encontró metadata en el PaymentIntent.");
                }

                const { userId, userEmail, items, total, shippingAddress } = JSON.parse(metadata);

                // Verificar si la orden ya fue creada (para evitar duplicados)
                const existingOrder = await Order.findOne({ paymentIntentId: paymentIntent.id });
                if (existingOrder) {
                    console.log(`Orden ${existingOrder.orderNumber} ya existe para el pago ${paymentIntent.id}. Ignorando.`);
                    return res.json({received: true});
                }

                // --- LÓGICA DE CREACIÓN DE ORDEN ---
                const orderNumber = `HJC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                
                const newOrder = new Order({
                    user: userId,
                    userEmail: userEmail,
                    items: items,
                    total: total,
                    shippingAddress: shippingAddress,
                    status: 'processing', // ¡El pago ya está hecho!
                    orderNumber: orderNumber,
                    paymentIntentId: paymentIntent.id,
                    paymentStatus: paymentIntent.status // 'succeeded'
                });

                await newOrder.save();
                console.log(`📦 Orden ${orderNumber} creada exitosamente.`);

                // Descontar el stock
                for (const item of items) {
                    await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
                }
                console.log(`📉 Stock actualizado.`);

                // Vaciar el carrito del usuario
                const user = await User.findById(userId);
                if (user) {
                    user.cart = [];
                    await user.save();
                    console.log(`🛒 Carrito del usuario ${userEmail} vaciado.`);
                }

            } catch (dbError) {
                console.error("❌ ERROR AL PROCESAR EL WEBHOOK EN LA DB:", dbError);
                // Si fallamos aquí, debemos avisarle a Stripe para que reintente
                return res.status(500).json({ error: "Error de base de datos al procesar el webhook." });
            }
            break;
        
        case 'payment_intent.payment_failed':
            const paymentIntentFailed = event.data.object;
            console.log(`❌ PaymentIntent ${paymentIntentFailed.id} falló.`);
            // Opcional: Enviar un email al usuario
            break;

        default:
            console.log(`Evento no manejado: ${event.type}`);
    }

    // Devolver una respuesta 200 a Stripe para confirmar la recepción
    res.json({received: true});
});


// Este middleware debe ir DESPUÉS del webhook de Stripe
app.use(express.json());

// Servir archivos estáticos
app.use('/Imagenes', express.static('Imagenes'));

// --- MIDDLEWARES DE AUTENTICACIÓN Y AUTORIZACIÓN ---
// ... (Tus middlewares authenticateToken, authorizeRoles, checkIfSilenced van aquí, no se modifican) ...
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: "No autorizado: Token no proporcionado." });
    }

    jwt.verify(token, JWT_SECRET, (err, payload) => {
        if (err) {
            const status = err.name === 'TokenExpiredError' ? 401 : 403;
            return res.status(status).json({ message: "No autorizado: Token inválido o expirado." });
        }
        req.user = payload;
        next();
    });
}

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

async function checkIfSilenced(req, res, next) {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        if (user.isSilenced) {
            if (user.silencedUntil && new Date() < user.silencedUntil) {
                const remainingTime = Math.ceil((user.silencedUntil - new Date()) / (1000 * 60)); // Minutos
                return res.status(403).json({
                    message: `Tu cuenta ha sido silenciada. No puedes realizar esta acción por ${remainingTime} minutos más.`
                });
            } else if (user.silencedUntil && new Date() >= user.silencedUntil) {
                user.isSilenced = false;
                user.silencedUntil = null;
                await user.save();
                req.user.isSilenced = false;
                next();
            } else {
                return res.status(403).json({
                    message: "Tu cuenta ha sido silenciada permanentemente. No puedes realizar esta acción."
                });
            }
        }
        next();
    } catch (error) {
        console.error("Error en el middleware checkIfSilenced:", error);
        res.status(500).json({ message: "Error en el servidor al verificar estado de silencio." });
    }
}


// 4. Definir las Rutas de la API

// --- RUTAS DE FORO, AUTH, PRODUCTOS, PERFIL, CARRITO, ADMIN ---
// ... (Todas tus rutas existentes van aquí, no se modifican) ...
// (app.get('/api/forum/posts'), app.post('/api/register'), app.get('/api/products'), app.get('/api/perfil'), app.get('/api/cart'), app.get('/api/admin/users'), etc...)
app.get('/api/forum/posts', async (req, res) => {
    try {
        const posts = await Post.find({})
            .populate('author', 'profile.name email')
            .sort({ createdAt: -1 });

        res.status(200).json(posts);
    } catch (error) {
        console.error("Error al obtener posts del foro:", error);
        res.status(500).json({ message: "Error en el servidor al obtener posts." });
    }
});

app.post('/api/forum/posts', authenticateToken, checkIfSilenced, async (req, res) => {
    try {
        const { title, content } = req.body;
        const authorId = req.user.id;

        if (!title || !content) {
            return res.status(400).json({ message: "El título y el contenido son obligatorios." });
        }

        const newPost = new Post({
            title: title,
            content: content,
            author: authorId
        });

        await newPost.save();

        const populatedPost = await Post.findById(newPost._id).populate('author', 'profile.name email');

        res.status(201).json({ message: "Tema creado exitosamente.", post: populatedPost });

    } catch (error) {
        console.error("Error al crear post:", error);
        res.status(500).json({ message: "Error en el servidor al crear el post." });
    }
});

app.get('/api/forum/posts/:postId', async (req, res) => {
    try {
        const { postId } = req.params;

        const post = await Post.findById(postId)
            .populate('author', 'profile.name email profile.avatar')
            .populate({
                path: 'comments',
                populate: [
                    { path: 'author', select: 'profile.name email profile.avatar' },
                    {
                        path: 'replies',
                        populate: {
                            path: 'author',
                            select: 'profile.name email profile.avatar'
                        }
                    }
                ]
            });

        if (!post) {
            return res.status(404).json({ message: "Tema de discusión no encontrado." });
        }

        res.status(200).json(post);

    } catch (error) {
        console.error("Error al obtener post único (con comentarios/respuestas):", error);
        res.status(500).json({ message: "Error en el servidor al obtener el post." });
    }
});

app.post('/api/forum/posts/:postId/comments', authenticateToken, checkIfSilenced, async (req, res) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;
        const authorId = req.user.id;

        if (!content) {
            return res.status(400).json({ message: "El contenido del comentario es obligatorio." });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Tema de discusión no encontrado." });
        }

        const newComment = new Comment({
            content: content,
            author: authorId,
            post: postId
        });

        await newComment.save();

        post.comments.push(newComment._id);
        await post.save();

        const populatedComment = await Comment.findById(newComment._id).populate('author', 'profile.name email profile.avatar');

        res.status(201).json({ message: "Comentario añadido exitosamente.", comment: populatedComment });

    } catch (error) {
        console.error("Error al añadir comentario:", error);
        res.status(500).json({ message: "Error en el servidor al añadir el comentario." });
    }
});

app.post('/api/forum/comments/:commentId/like', authenticateToken, checkIfSilenced, async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comentario no encontrado." });
        }

        if (comment.dislikes.includes(userId)) {
            comment.dislikes.pull(userId);
        }

        if (comment.likes.includes(userId)) {
            comment.likes.pull(userId);
        } else {
            comment.likes.push(userId);
        }
        await comment.save();
        return res.status(200).json({ message: "Interacción actualizada.", comment });
    } catch (error) {
        console.error("Error al dar like:", error);
        res.status(500).json({ message: "Error en el servidor al procesar el like." });
    }
});

app.post('/api/forum/comments/:commentId/dislike', authenticateToken, checkIfSilenced, async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comentario no encontrado." });
        }

        if (comment.likes.includes(userId)) {
            comment.likes.pull(userId);
        }

        if (comment.dislikes.includes(userId)) {
            comment.dislikes.pull(userId);
        } else {
            comment.dislikes.push(userId);
        }
        await comment.save();
        return res.status(200).json({ message: "Interacción actualizada.", comment });
    } catch (error) {
        console.error("Error al dar dislike:", error);
        res.status(500).json({ message: "Error en el servidor al procesar el dislike." });
    }
});

app.get('/api/admin/reports/:reportId', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { reportId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(reportId)) {
            return res.status(400).json({ message: 'ID de reporte inválido.' });
        }

        const report = await Report.findById(reportId)
            .populate('reportedBy', 'profile.name email')
            .populate({
                path: 'reportedItem',
                select: 'title content author createdAt',
                populate: {
                    path: 'author',
                    select: 'profile.name email'
                }
            });

        if (!report) {
            return res.status(404).json({ message: 'Reporte no encontrado.' });
        }

        res.status(200).json(report);
    } catch (error) {
        console.error("Error al obtener reporte específico (Admin):", error);
        res.status(500).json({ message: "Error en el servidor al obtener el reporte." });
    }
});

app.get('/api/admin/reports', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const reports = await Report.find({ status: 'Pendiente' })
            .populate('reportedBy', 'profile.name email')
            .populate({
                path: 'reportedItem',
                select: 'content title author',
                populate: {
                    path: 'author',
                    select: 'profile.name email'
                }
            })
            .sort({ createdAt: 1 });

        res.status(200).json(reports);
    } catch (error) {
        console.error("Error al obtener reportes pendientes:", error);
        res.status(500).json({ message: "Error en el servidor al obtener reportes." });
    }
});

app.get('/api/admin/reports/resolved', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const reports = await Report.find({ status: { $ne: 'Pendiente' } })
            .populate('reportedBy', 'profile.name email')
            .populate('resolvedBy', 'profile.name email')
            .populate({
                path: 'reportedItem',
                select: 'content title author',
                populate: {
                    path: 'author',
                    select: 'profile.name email'
                }
            })
            .sort({ resolvedAt: -1 });

        res.status(200).json(reports);
    } catch (error) {
        console.error("Error al obtener reportes resueltos:", error);
        res.status(500).json({ message: "Error en el servidor al obtener reportes resueltos." });
    }
});

app.post('/api/forum/comments/:commentId/report', authenticateToken, checkIfSilenced, async (req, res) => {
    try {
        const { commentId } = req.params;
        const { reason, customReason } = req.body;
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({ message: "ID de comentario inválido." });
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comentario no encontrado." });
        }

        const existingReport = await Report.findOne({
            reportedBy: userId,
            reportedItem: commentId,
            onModel: 'Comment'
        });

        if (existingReport) {
            return res.status(400).json({ message: "Ya has reportado este comentario previamente." });
        }

        const newReport = new Report({
            reportedBy: userId,
            reportedItem: commentId,
            onModel: 'Comment',
            reason: reason,
            customReason: reason === 'Otro' ? customReason : ''
        });
        await newReport.save();

        comment.hasPendingReports = true;
        await comment.save();

        res.status(200).json({ message: "Comentario reportado exitosamente. Será revisado por un moderador." });
    } catch (error) {
        console.error("Error al reportar comentario:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        if (error.code === 11000) {
            return res.status(400).json({ message: "Ya has reportado este comentario." });
        }
        res.status(500).json({ message: "Error en el servidor al reportar el comentario." });
    }
});

app.post('/api/forum/posts/:postId/report', authenticateToken, checkIfSilenced, async (req, res) => {
    try {
        const { postId } = req.params;
        const { reason, customReason } = req.body;
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ message: "ID de post inválido." });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post no encontrado." });
        }

        const existingReport = await Report.findOne({
            reportedBy: userId,
            reportedItem: postId,
            onModel: 'Post'
        });

        if (existingReport) {
            return res.status(400).json({ message: "Ya has reportado este post previamente." });
        }

        const newReport = new Report({
            reportedBy: userId,
            reportedItem: postId,
            onModel: 'Post',
            reason: reason,
            customReason: reason === 'Otro' ? customReason : ''
        });
        await newReport.save();

        post.hasPendingReports = true;
        await post.save();

        res.status(200).json({ message: "Post reportado exitosamente. Será revisado por un moderador." });
    } catch (error) {
        console.error("Error al reportar post:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        if (error.code === 11000) {
            return res.status(400).json({ message: "Ya has reportado este post." });
        }
        res.status(500).json({ message: "Error en el servidor al reportar el post." });
    }
});

app.post('/api/forum/replies/:replyId/report', authenticateToken, checkIfSilenced, async (req, res) => {
    try {
        const { replyId } = req.params;
        const { reason, customReason } = req.body;
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(replyId)) {
            return res.status(400).json({ message: "ID de respuesta inválido." });
        }

        const reply = await Reply.findById(replyId);
        if (!reply) {
            return res.status(404).json({ message: "Respuesta no encontrada." });
        }

        const existingReport = await Report.findOne({
            reportedBy: userId,
            reportedItem: replyId,
            onModel: 'Reply'
        });

        if (existingReport) {
            return res.status(400).json({ message: "Ya has reportado esta respuesta previamente." });
        }

        const newReport = new Report({
            reportedBy: userId,
            reportedItem: replyId,
            onModel: 'Reply',
            reason: reason,
            customReason: reason === 'Otro' ? customReason : ''
        });
        await newReport.save();

        reply.hasPendingReports = true;
        await reply.save();

        res.status(200).json({ message: "Respuesta reportada exitosamente. Será revisado por un moderador." });
    } catch (error) {
        console.error("Error al reportar respuesta:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        if (error.code === 11000) {
            return res.status(400).json({ message: "Ya has reportado esta respuesta." });
        }
        res.status(500).json({ message: "Error en el servidor al reportar la respuesta." });
    }
});

app.post('/api/forum/replies/:replyId/like', authenticateToken, checkIfSilenced, async (req, res) => {
    try {
        const { replyId } = req.params;
        const userId = req.user.id;
        const reply = await Reply.findById(replyId);
        if (!reply) return res.status(404).json({ message: "Respuesta no encontrada." });

        if (reply.dislikes.includes(userId)) reply.dislikes.pull(userId);
        if (reply.likes.includes(userId)) {
            reply.likes.pull(userId);
        } else {
            reply.likes.push(userId);
        }
        await reply.save();
        res.status(200).json({ message: "Interacción de respuesta actualizada.", reply });
    } catch (error) {
        console.error("Error al dar like a respuesta:", error);
        res.status(500).json({ message: "Error en el servidor al procesar el like." });
    }
});

app.post('/api/forum/replies/:replyId/dislike', authenticateToken, checkIfSilenced, async (req, res) => {
    try {
        const { replyId } = req.params;
        const userId = req.user.id;
        const reply = await Reply.findById(replyId);
        if (!reply) return res.status(404).json({ message: "Respuesta no encontrada." });

        if (reply.likes.includes(userId)) reply.likes.pull(userId);
        if (reply.dislikes.includes(userId)) {
            reply.dislikes.pull(userId);
        } else {
            reply.dislikes.push(userId);
        }
        await reply.save();
        res.status(200).json({ message: "Interacción de respuesta actualizada.", reply });
    } catch (error) {
        console.error("Error al dar dislike a respuesta:", error);
        res.status(500).json({ message: "Error en el servidor al procesar el dislike." });
    }
});

app.post('/api/forum/comments/:commentId/replies', authenticateToken, checkIfSilenced, async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const authorId = req.user.id;

        if (!content) {
            return res.status(400).json({ message: "El contenido de la respuesta es obligatorio." });
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comentario no encontrado." });
        }

        const newReply = new Reply({
            content: content,
            author: authorId,
            comment: commentId
        });

        await newReply.save();

        comment.replies.push(newReply._id);
        await comment.save();

        const populatedReply = await Reply.findById(newReply._id).populate('author', 'profile.name email profile.avatar');

        res.status(201).json({ message: "Respuesta añadida exitosamente.", reply: populatedReply });

    } catch (error) {
        console.error("Error al añadir respuesta:", error);
        res.status(500).json({ message: "Error en el servidor al añadir la respuesta." });
    }
});

app.get('/api/test', (req, res) => {
    res.json({ message: "¡Conexión con el backend exitosa! ✨" });
});

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
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

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
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

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

app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({ message: "Error en el servidor al obtener productos." });
    }
});

app.post('/api/seed-products', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    // ... (Tu código de seed-products) ...
});

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
                wishlist: user.wishlist,
                isSilenced: user.isSilenced,
                silencedUntil: user.silencedUntil
            }
        });
    } catch (error) {
        console.error("Error al obtener perfil:", error);
        res.status(500).json({ message: "Error en el servidor al obtener perfil." });
    }
});

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
        await order.save({ validateBeforeSave: false });

        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
        }

        res.status(200).json({ message: 'Pedido cancelado exitosamente.', orderId: order._id, newStatus: order.status });

    } catch (error) {
        console.error('Error al cancelar el pedido:', error);
        res.status(500).json({ message: 'Error interno del servidor al cancelar el pedido.' });
    }
});

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

app.post('/api/upload-avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No se subió ningún archivo." });
        }

        if (!IMGBB_API_KEY) {
            return res.status(500).json({ message: "Configuración de API Key de ImgBB faltante en el servidor." });
        }

        const base64Image = Buffer.from(req.file.buffer).toString('base64');

        const params = new URLSearchParams();
        params.append('key', IMGBB_API_KEY);
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

app.get('/api/orders/by-payment-intent/:intentId', authenticateToken, async (req, res) => {
    try {
        const { intentId } = req.params;

        const order = await Order.findOne({ 
            paymentIntentId: intentId,
            user: req.user.id // Asegurarse de que solo el usuario que pagó pueda verla
        });

        if (!order) {
            // ¡Esto NO es un error! Significa que el webhook aún no ha terminado.
            // Enviamos un 404 para que el frontend sepa que debe seguir intentando.
            return res.status(404).json({ message: "Orden no encontrada, procesando..." });
        }

        // ¡La encontramos! Enviamos la orden completa.
        res.status(200).json({ order: order });

    } catch (error) {
        console.error("Error al buscar orden por Payment Intent ID:", error);
        res.status(500).json({ message: "Error en el servidor." });
    }
});


// --- AÑADIDA: RUTA DE PAGO DE STRIPE ---

// *** ENDPOINT: Crear un "Intento de Pago" (Payment Intent) ***
app.post('/api/payment/create-payment-intent', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userEmail = req.user.email;
        const { items, shippingAddress, total, shipping } = req.body; // Recibimos los datos del frontend

        // 1. Validar Stock (importante)
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ message: `Producto no encontrado: ${item.productName}.` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ message: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Pedido: ${item.quantity}.` });
            }
        }
        
        // 2. Preparar los datos para guardar en el metadata
        // El webhook necesitará esta info para crear la orden
        const cartMetadata = JSON.stringify({
            userId: userId,
            userEmail: userEmail,
            items: items, // El array de items del carrito
            total: total, // El total final (items + shipping)
            shippingAddress: shippingAddress // El objeto de dirección
        });

        // 3. Crear el Payment Intent en Stripe
        // ¡IMPORTANTE! Stripe maneja las monedas en centavos.
        // $32.000 COP deben ser 3200000.
        const amountInCents = Math.round(total * 100);

        const paymentIntent = await stripeClient.paymentIntents.create({
            amount: amountInCents,
            currency: 'cop', // Pesos Colombianos
            automatic_payment_methods: { enabled: true },
            description: `Pedido para ${userEmail}`,
            metadata: {
                cart: cartMetadata // Guardamos toda la info de la orden aquí
            }
        });

        // 4. Enviar el "client_secret" al frontend
        // El frontend lo necesita para mostrar el formulario de pago
        res.status(201).json({
            message: "Intento de pago creado.",
            clientSecret: paymentIntent.client_secret
        });

    } catch (error) {
        console.error("Error al crear Payment Intent de Stripe:", error.response ? error.response.data : error.message);
        res.status(500).json({ message: "Error en el servidor al crear el intento de pago.", error: error.message });
    }
});
// --- FIN RUTAS DE STRIPE ---


// --- RUTAS DE ADMIN ---
// ... (Todas tus rutas de ADMIN van aquí, no se modifican) ...
// (app.get('/api/admin/products/:id'), app.post('/api/admin/products'), etc...)
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
            return res.status(400).json({ message: 'Rol inválido proporcionado.' });
        }

        if (req.user.id === id.toString() && role === 'user') {
            return res.status(403).json({ message: 'No puedes cambiar tu propio rol de administrador.' });
        }

        const targetUser = await User.findById(id);
        if (targetUser && targetUser.role === 'admin' && req.user.id !== id.toString()) {
            if (role === 'user') {
                return res.status(403).json({ message: 'No puedes degradar a otro administrador.' });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true }).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.status(200).json({ message: 'Rol de usuario actualizado con éxito.', user: updatedUser });

    } catch (error) {
        console.error('Error al actualizar el rol del usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar el rol.' });
    }
});

app.post('/api/admin/users/:id/silence', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { durationMinutes } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de usuario inválido.' });
        }

        const userToSilence = await User.findById(id);
        if (!userToSilence) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        if (req.user.id === id.toString()) {
            return res.status(403).json({ message: 'No puedes silenciar tu propia cuenta de administrador.' });
        }

        if (userToSilence.role === 'admin') {
            return res.status(403).json({ message: 'No puedes silenciar a otro administrador.' });
        }

        userToSilence.isSilenced = true;
        if (durationMinutes && durationMinutes > 0) {
            userToSilence.silencedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
        } else {
            userToSilence.silencedUntil = null;
        }

        await userToSilence.save();

        res.status(200).json({
            message: `Usuario ${userToSilence.profile.name} silenciado exitosamente.`,
            isSilenced: userToSilence.isSilenced,
            silencedUntil: userToSilence.silencedUntil
        });

    } catch (error) {
        console.error('Error al silenciar usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor al silenciar al usuario.' });
    }
});

app.post('/api/admin/users/:id/unsilence', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID de usuario inválido.' });
        }

        const userToUnsilence = await User.findById(id);
        if (!userToUnsilence) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        if (!userToUnsilence.isSilenced) {
            return res.status(400).json({ message: 'El usuario no está silenciado.' });
        }

        userToUnsilence.isSilenced = false;
        userToUnsilence.silencedUntil = null;
        await userToUnsilence.save();

        res.status(200).json({
            message: `Usuario ${userToUnsilence.profile.name} desilenciado exitosamente.`,
            isSilenced: userToUnsilence.isSilenced,
            silencedUntil: userToUnsilence.silencedUntil
        });

    } catch (error) {
        console.error('Error al desilenciar usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor al desilenciar al usuario.' });
    }
});

app.put('/api/admin/reports/:reportId/resolve', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { reportId } = req.params;
        const { action } = req.body;
        const adminId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(reportId)) {
            return res.status(400).json({ message: 'ID de reporte inválido.' });
        }
        if (!['resolve', 'dismiss'].includes(action)) {
            return res.status(400).json({ message: 'Acción inválida. Debe ser "resolve" o "dismiss".' });
        }

        const report = await Report.findById(reportId);
        if (!report) {
            return res.status(404).json({ message: 'Reporte no encontrado.' });
        }
        if (report.status !== 'Pendiente') {
            return res.status(400).json({ message: 'Este reporte ya ha sido procesado.' });
        }

        report.status = action === 'resolve' ? 'Resuelto' : 'Desestimado';
        report.resolvedBy = adminId;
        report.resolvedAt = new Date();
        await report.save();

        const remainingReports = await Report.countDocuments({
            reportedItem: report.reportedItem,
            onModel: report.onModel,
            status: 'Pendiente'
        });

        if (remainingReports === 0) {
            let itemModel;
            switch (report.onModel) {
                case 'Comment': itemModel = Comment; break;
                case 'Reply': itemModel = Reply; break;
                case 'Post': itemModel = Post; break;
                default: itemModel = null;
            }

            if (itemModel) {
                await itemModel.findByIdAndUpdate(report.reportedItem, { hasPendingReports: false });
            }
        }

        res.status(200).json({ message: `Reporte ${action === 'resolve' ? 'resuelto' : 'desestimado'} exitosamente.`, report });

    } catch (error) {
        console.error("Error al resolver reporte:", error);
        res.status(500).json({ message: "Error en el servidor al procesar el reporte." });
    }
});

app.delete('/api/admin/item/:onModel/:itemId', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { onModel, itemId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({ message: 'ID de ítem inválido.' });
        }

        let Model;
        let parentId = null;

        switch (onModel) {
            case 'Comment':
                Model = Comment;
                const commentToDelete = await Comment.findById(itemId);
                if (commentToDelete) parentId = commentToDelete.post;
                break;
            case 'Reply':
                Model = Reply;
                const replyToDelete = await Reply.findById(itemId);
                if (replyToDelete) parentId = replyToDelete.comment;
                break;
            case 'Post':
                Model = Post;
                break;
            default:
                return res.status(400).json({ message: 'Tipo de modelo inválido para eliminación.' });
        }

        if (!Model) {
            return res.status(400).json({ message: 'Modelo no especificado o inválido.' });
        }

        const deletedItem = await Model.findByIdAndDelete(itemId);

        if (!deletedItem) {
            return res.status(404).json({ message: `${onModel} no encontrado.` });
        }

        if (onModel === 'Post') {
            const commentsToDelete = await Comment.find({ post: itemId });
            const commentIds = commentsToDelete.map(c => c._id);
            await Reply.deleteMany({ comment: { $in: commentIds } });
            await Comment.deleteMany({ post: itemId });
        }

        if (onModel === 'Comment') {
            await Reply.deleteMany({ comment: itemId });
            if (parentId) {
                await Post.findByIdAndUpdate(parentId, { $pull: { comments: itemId } });
            }
        }

        if (onModel === 'Reply' && parentId) {
            await Comment.findByIdAndUpdate(parentId, { $pull: { replies: itemId } });
        }

        await Report.deleteMany({ reportedItem: itemId, onModel: onModel });

        res.status(200).json({ message: `${onModel} y sus reportes asociados eliminados exitosamente.`, deletedItemId: itemId });

    } catch (error) {
        console.error(`Error al eliminar ${onModel}:`, error);
        res.status(500).json({ message: `Error en el servidor al eliminar el ${onModel}.` });
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

app.get('/api/admin/orders', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const orders = await Order.find().populate('user', 'email profile.name').sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error al obtener pedidos (Admin):", error);
        res.status(500).json({ message: "Error en el servidor al obtener pedidos." });
    }
});

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
    // --- AÑADIDO: Logs de Stripe ---
    console.log(`💳 STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY ? 'SET' : 'NOT SET'}`);
    console.log(`🪝 STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET ? 'SET' : 'NOT SET'}`);
    console.log(`🔗 BACKEND_URL: ${BACKEND_URL}`);
    console.log(`🖥️ FRONTEND_URL: ${FRONTEND_URL}`);
});