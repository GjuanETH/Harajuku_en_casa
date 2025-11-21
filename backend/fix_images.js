// backend/fix_images_v2.js
require('dotenv').config();
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: String,
    imageUrl: String
});
const Product = mongoose.model('Product', productSchema);

const fixPaths = async () => {
    try {
        console.log("🔌 Conectando a MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Conectado.");

        const products = await Product.find({});
        let updatedCount = 0;

        console.log("🔍 Buscando rutas incorrectas con '/api/Imagenes'...");

        for (const product of products) {
            // Buscamos si la URL tiene el error "/api/Imagenes"
            if (product.imageUrl && product.imageUrl.includes('/api/Imagenes')) {
                
                // Reemplazamos "/api/Imagenes" por solo "/Imagenes"
                const newImage = product.imageUrl.replace('/api/Imagenes', '/Imagenes');

                console.log(`✏️ Corrigiendo: ${product.name}`);
                console.log(`   🔴 Mal:  ${product.imageUrl}`);
                console.log(`   🟢 Bien: ${newImage}`);

                product.imageUrl = newImage;
                await product.save();
                updatedCount++;
            }
        }

        console.log(`\n🎉 ¡Listo! Se corrigieron ${updatedCount} productos.`);
        process.exit();
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
};

fixPaths();