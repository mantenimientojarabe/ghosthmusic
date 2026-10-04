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

// ENDPOINT 2: El Redireccionador Maestro (Con Múltiples Servidores Fallback)
app.get('/api/stream', async (req, res) => {
    try {
        const idVideo = req.query.id;
        if (!idVideo) return res.status(400).send("Falta el ID del video");

        // Lista de servidores públicos antibloqueos (Si uno cae, usa el siguiente)
        const servidoresPiped = [
            "https://pipedapi.kavin.rocks",
            "https://pipedapi.tokhmi.xyz",
            "https://piped-api.garudalinux.org",
            "https://pi.ggtyler.dev/api"
        ];

        let datos = null;

        // Intentamos conectarnos a cada servidor uno por uno
        for (const servidor of servidoresPiped) {
            try {
                console.log(`Intentando extraer audio desde: ${servidor}`);
                const respuesta = await fetch(`${servidor}/streams/${idVideo}`);
                
                if (respuesta.ok) {
                    datos = await respuesta.json();
                    break; // Si funcionó, rompemos el ciclo y avanzamos
                }
            } catch (error) {
                console.log(`Servidor ${servidor} no respondió, intentando el siguiente...`);
            }
        }

        // Si después de intentar con todos, no obtuvimos datos, lanzamos error
        if (!datos || !datos.audioStreams || datos.audioStreams.length === 0) {
            return res.status(404).send("Ningún servidor pudo procesar el audio en este momento.");
        }

        // Ordenamos los audios y tomamos el de mayor calidad
        const mejorAudio = datos.audioStreams.sort((a, b) => b.bitrate - a.bitrate)[0];

        // Redirigimos el reproductor al enlace real
        res.redirect(mejorAudio.url);

    } catch (error) {
        console.error("Error crítico obteniendo el stream:", error);
        res.status(500).send("Error al cargar el audio");
    }
});

// Encendemos el motor
const PUERTO = process.env.PORT || 3000;
app.listen(PUERTO, () => {
    console.log(`Motor de GhostMusic encendido en el puerto ${PUERTO}`);
});
