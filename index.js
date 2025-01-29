const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({
    origin: ['https://yoydios.github.io', 'https://yoydios.github.io/blog/'],
    methods: 'GET,POST,DELETE',
    allowedHeaders: 'Content-Type'
}));
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
//Delete esquema
const deletedBlogSchema = new mongoose.Schema({
    original_id: mongoose.Schema.Types.ObjectId,
    post_title: String,
    post_author: String,
    post_date: Date,
    post_excerpt: String,
    post_content: String,
    post_status: String,
    post_modified: Date,
    deleted_at: { type: Date, default: Date.now }
});

const DeletedEntry = mongoose.model('DeletedEntry', deletedBlogSchema);
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
// Ruta para eliminar una entrada por ID
app.delete('/api/entries/:id', async (req, res) => {
    try {
        const entry = await BlogEntry.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ error: "Entrada no encontrada" });
        }

        // Guardar en la colección de backups
        await DeletedEntry.create({
            original_id: entry._id,
            post_title: entry.post_title,
            post_author: entry.post_author,
            post_date: entry.post_date,
            post_excerpt: entry.post_excerpt,
            post_content: entry.post_content,
            post_status: entry.post_status,
            post_modified: entry.post_modified,
        });

        // Eliminar la entrada original
        await BlogEntry.findByIdAndDelete(req.params.id);

        res.json({ message: "Entrada eliminada y respaldada correctamente" });
    } catch (err) {
        res.status(500).json({ error: "Error al eliminar la entrada" });
    }
});


app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
