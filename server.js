const express = require('express');
const cors = require('cors');
const yts = require('yt-search');

const app = express();
app.use(cors());

// ENDPOINT 1: Buscador (Se queda igual, porque este sí funciona bien)
app.get('/api/buscar', async (req, res) => {
    try {
        const texto = req.query.q;
        if (!texto) return res.status(400).json({ error: "Falta el texto de búsqueda" });

        const resultados = await yts(texto);
        
        if (resultados.videos.length > 0) {
            const video = resultados.videos[0];
            res.json({
                id: video.videoId,
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

// ENDPOINT 2: El Redireccionador Maestro (El fix definitivo)
app.get('/api/stream', async (req, res) => {
    try {
        const idVideo = req.query.id;
        if (!idVideo) return res.status(400).send("Falta el ID del video");

        // 1. Usamos la API pública antibloqueos de Piped para pedir la información del video
        const respuesta = await fetch(`https://pipedapi.kavin.rocks/streams/${idVideo}`);
        const datos = await respuesta.json();

        // 2. Verificamos que tenga los streams de audio
        if (!datos.audioStreams || datos.audioStreams.length === 0) {
            return res.status(404).send("Audio no disponible temporalmente");
        }

        // 3. Ordenamos los audios y tomamos el de mayor calidad (mejor bitrate)
        const mejorAudio = datos.audioStreams.sort((a, b) => b.bitrate - a.bitrate)[0];

        // 4. LA MAGIA: En lugar de descargar el audio, redirigimos tu reproductor 
        // para que tome la música directamente desde los servidores reales sin pasar por Railway.
        res.redirect(mejorAudio.url);

    } catch (error) {
        console.error("Error obteniendo el stream:", error);
        res.status(500).send("Error al cargar el audio");
    }
});

// Encendemos el motor
const PUERTO = process.env.PORT || 3000;
app.listen(PUERTO, () => {
    console.log(`Motor de GhostMusic encendido en el puerto ${PUERTO}`);
});
