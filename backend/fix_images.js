// backend/fix_images.js
require('dotenv').config();
const mongoose = require('mongoose');

// 1. Definir el esquema temporalmente (solo necesitamos esto)
const productSchema = new mongoose.Schema({
    imageUrl: String
});
const Product = mongoose.model('Product', productSchema);

// --- CONFIGURACIÓN ---
const OLD_URL = 'http://localhost:3000';
// ¡OJO! Asegúrate de que esta variable BACKEND_URL esté en tu archivo .env
// O escríbela aquí directamente así: const NEW_URL = 'https://tu-app.onrender.com';
const NEW_URL = process.env.BACKEND_URL; 

const fixImages = async () => {
    try {
        if (!NEW_URL) {
            throw new Error("❌ No se encontró BACKEND_URL en el archivo .env");
        }

        console.log("Conectando a la base de datos...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Conectado.");

        // 2. Buscar todos los productos
        const products = await Product.find({});
        console.log(`🔍 Analizando ${products.length} productos...`);

        let updatedCount = 0;

        // 3. Recorrer y actualizar
        for (const product of products) {
            if (product.imageUrl && product.imageUrl.includes(OLD_URL)) {
                // Reemplazar la parte vieja por la nueva
                const newImage = product.imageUrl.replace(OLD_URL, NEW_URL);
                
                console.log(`🔄 Actualizando: ${product.imageUrl} -> ${newImage}`);
                
                product.imageUrl = newImage;
                await product.save();
                updatedCount++;
            }
        }

        console.log(`------------------------------------------------`);
        console.log(`🎉 ¡Listo! Se actualizaron ${updatedCount} imágenes.`);
        console.log(`🌍 Ahora apuntan a: ${NEW_URL}`);
        console.log(`------------------------------------------------`);

        process.exit();
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
};

fixImages();