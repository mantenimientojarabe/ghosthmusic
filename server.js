const express = require('express');
const cors = require('cors');
const play = require('play-dl');

const app = express();

// Autorizamos a tu página de Firebase a conectarse
app.use(cors());

// ENDPOINT 1: El buscador de canciones
app.get('/api/buscar', async (req, res) => {
    try {
        const texto = req.query.q;
        if (!texto) return res.status(400).json({ error: "Falta el texto de búsqueda" });

        const resultados = await play.search(texto, { limit: 1 });

        if (resultados.length > 0) {
            const video = resultados[0];
            res.json({
                id: video.id,
                titulo: video.title,
                artista: video.channel.name,
                portada: video.thumbnails[video.thumbnails.length - 1].url
            });
        } else {
            res.status(404).json({ error: "No se encontró música" });
        }
    } catch (error) {
        console.error("Error buscando:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// ENDPOINT 2: El transmisor de audio (Streaming)
app.get('/api/stream', async (req, res) => {
    try {
        const idVideo = req.query.id;
        if (!idVideo) return res.status(400).send("Falta el ID del video");

        // EL FIX: Armamos la URL completa oficial de YouTube usando el ID
        const urlCompleta = `https://www.youtube.com/watch?v=${idVideo}`;

        // Le pasamos la URL completa a play-dl
        const infoAudio = await play.stream(urlCompleta);

        res.setHeader('Content-Type', 'audio/webm');
        infoAudio.stream.pipe(res);

    } catch (error) {
        console.error("Error transmitiendo:", error);
        res.status(500).send("Error al cargar el audio");
    }
});

// Encendemos el servidor (Railway usa process.env.PORT)
const PUERTO = process.env.PORT || 3000;
app.listen(PUERTO, () => {
    console.log(`Motor de GhostMusic encendido en el puerto ${PUERTO}`);
});
