const express = require('express');
const cors = require('cors');
const play = require('play-dl');

const app = express();
app.use(cors());

// Configuramos el Client ID de SoundCloud al iniciar el servidor
async function setupSoundCloud() {
    try {
        const client_id = await play.getFreeClientID();
        await play.setToken({
            soundcloud: {
                client_id: client_id
            }
        });
        console.log("SoundCloud configurado correctamente.");
    } catch (error) {
        console.error("Error al configurar SoundCloud:", error);
    }
}
setupSoundCloud();

// ENDPOINT 1: Buscador (Ahora usa SoundCloud)
app.get('/api/buscar', async (req, res) => {
    try {
        const texto = req.query.q;
        if (!texto) return res.status(400).json({ error: "Falta el texto de búsqueda" });

        const resultados = await play.search(texto, { 
            limit: 1, 
            source: { soundcloud: 'tracks' } 
        });

        if (resultados.length > 0) {
            const pista = resultados[0];
            res.json({
                id: pista.url,
                titulo: pista.name,
                artista: pista.user.name,
                portada: pista.thumbnail || 'https://placehold.co/300x300/2a2a2a/ffffff?text=GhostMusic'
            });
        } else {
            res.status(404).json({ error: "No se encontró música" });
        }
    } catch (error) {
        console.error("Error buscando en SoundCloud:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// ENDPOINT 2: Transmisor de audio
app.get('/api/stream', async (req, res) => {
    try {
        const urlPista = req.query.id;
        if (!urlPista) return res.status(400).send("Falta la URL de la pista");

        const infoAudio = await play.stream(urlPista);

        res.setHeader('Content-Type', 'audio/webm');
        infoAudio.stream.pipe(res);

    } catch (error) {
        console.error("Error transmitiendo:", error);
        res.status(500).send("Error al cargar el audio");
    }
});

// Encendemos el motor
const PUERTO = process.env.PORT || 3000;
app.listen(PUERTO, () => {
    console.log(`Motor de GhostMusic encendido en el puerto ${PUERTO}`);
});
