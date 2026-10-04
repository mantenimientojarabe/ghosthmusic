const express = require('express');
const cors = require('cors');
const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');

const app = express();
app.use(cors());

// ENDPOINT 1: Buscador en YouTube (Anti-bloqueos)
app.get('/api/buscar', async (req, res) => {
    try {
        const texto = req.query.q;
        if (!texto) return res.status(400).json({ error: "Falta el texto de búsqueda" });

        // Buscamos directamente usando yt-search
        const resultados = await yts(texto);
        
        if (resultados.videos.length > 0) {
            const video = resultados.videos[0];
            res.json({
                id: video.videoId, // Retornamos el ID puro de YouTube
                titulo: video.title,
                artista: video.author.name,
                portada: video.thumbnail
            });
        } else {
            res.status(404).json({ error: "No se encontró música" });
        }
    } catch (error) {
        console.error("Error buscando:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// ENDPOINT 2: Transmisor de audio de alta calidad
app.get('/api/stream', (req, res) => {
    try {
        const idVideo = req.query.id;
        if (!idVideo) return res.status(400).send("Falta el ID del video");

        const urlCompleta = `https://www.youtube.com/watch?v=${idVideo}`;

        // Avisamos al navegador que viene audio
        res.setHeader('Content-Type', 'audio/webm');
        
        // Extraemos solo el audio con la calidad más alta posible
        ytdl(urlCompleta, { 
            filter: 'audioonly',
            quality: 'highestaudio'
        }).pipe(res);

    } catch (error) {
        console.error("Error transmitiendo:", error);
        res.status(500).send("Error al cargar el audio");
    }
});

// Encendemos el motor
const PUERTO = process.env.PORT || 3000;
app.listen(PUERTO, () => {
    console.log(`Motor definitivo de GhostMusic encendido en el puerto ${PUERTO}`);
});
