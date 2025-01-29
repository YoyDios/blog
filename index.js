const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Conectar a MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB conectado'))
.catch(err => console.error('Error al conectar con MongoDB:', err));

// Definir esquema y modelo de entrada de blog
const blogSchema = new mongoose.Schema({
    post_title: String,
    post_author: String,
    post_date: Date,
    post_excerpt: String,
    post_content: String,
    post_status: { type: String, default: "publish" },
    post_modified: { type: Date, default: Date.now }
});

const BlogEntry = mongoose.model('BlogEntry', blogSchema);

// Ruta para obtener todas las entradas
app.get('/api/entries', async (req, res) => {
    try {
        const entries = await BlogEntry.find({ post_status: "publish" }).sort({ post_date: -1 });
        res.json(entries);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener las entradas" });
    }
});

// Ruta para obtener una entrada por ID
app.get('/api/entries/:id', async (req, res) => {
    try {
        const entry = await BlogEntry.findById(req.params.id);
        if (!entry) return res.status(404).json({ error: "Entrada no encontrada" });
        res.json(entry);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener la entrada" });
    }
});

// Ruta para agregar una nueva entrada
app.post('/api/entries', async (req, res) => {
    try {
        const newEntry = new BlogEntry(req.body);
        await newEntry.save();
        res.status(201).json(newEntry);
    } catch (err) {
        res.status(500).json({ error: "Error al guardar la entrada" });
    }
});

app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));

