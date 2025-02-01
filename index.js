const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors({
    origin: ['https://yoydios.github.io', 'https://yoydios.github.io/blog/'],
    methods: 'GET,POST,DELETE',
    allowedHeaders: 'Content-Type'
}));
const PORT = process.env.PORT || 3000;
const GITHUB_REPO = "yoydios/blog";
const FILE_PATH = "Entradas/entries.json";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`;

app.use(express.json());

async function getFileContent() {
    try {
        const response = await axios.get(GITHUB_API_URL, {
            headers: { Authorization: `token ${GITHUB_TOKEN}` }
        });
        const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
        return { content: JSON.parse(content), sha: response.data.sha };
    } catch (error) {
        return { content: [], sha: null };
    }
}

async function updateFileContent(newContent, sha) {
    const encodedContent = Buffer.from(JSON.stringify(newContent, null, 2)).toString('base64');
    await axios.put(GITHUB_API_URL, {
        message: "Update entries.json",
        content: encodedContent,
        sha,
    }, {
        headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });
}

app.get('/api/entries', async (req, res) => {
    const { content } = await getFileContent();
    res.json(content);
});

app.post('/api/entries', async (req, res) => {
    const { content, sha } = await getFileContent();
    const newEntry = { id: Date.now(), ...req.body };
    content.push(newEntry);
    await updateFileContent(content, sha);
    res.status(201).json(newEntry);
});

app.delete('/api/entries/:id', async (req, res) => {
    const { content, sha } = await getFileContent();
    const newContent = content.filter(entry => entry.id !== parseInt(req.params.id));
    await updateFileContent(newContent, sha);
    res.json({ message: "Entrada eliminada correctamente" });
});

app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
