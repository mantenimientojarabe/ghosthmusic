const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

// ENDPOINT 1: Buscador Maestro en la API de Música Oficial (JioSaavn)
app.get('/api/buscar', async (req, res) => {
    try {
        const texto = req.query.q;
        if (!texto) return res.status(400).json({ error: "Falta el texto de búsqueda" });

        console.log(`Buscando: ${texto}`);
        
        // Conectamos con el proveedor de música oficial agregando un User-Agent (Para que no nos detecten como robot)
        const respuesta = await fetch(`https://saavn.dev/api/search/songs?query=${encodeURIComponent(texto)}`, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
        });
        
        const datos = await respuesta.json();

        // Verificamos si la API devolvió resultados
        if (datos.success && datos.data && datos.data.results && datos.data.results.length > 0) {
            const cancion = datos.data.results[0];
            
            // Extraemos la portada de mayor calidad (Generalmente la última de la lista)
            const portadas = cancion.image || [];
            const portadaHD = portadas.length > 0 ? (portadas[portadas.length - 1].url || portadas[portadas.length - 1].link) : 'https://placehold.co/300';
            
            // Extraemos el enlace del audio directo de estudio
            const audios = cancion.downloadUrl || [];
            const mejorAudio = audios.length > 0 ? (audios[audios.length - 1].url || audios[audios.length - 1].link) : null;

            if (!mejorAudio) {
                return res.status(404).json({ error: "Audio no disponible" });
            }

            // Limpiamos los títulos (A veces traen caracteres HTML raros)
            const tituloLimpio = cancion.name.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, "&");

            res.json({
                id: mejorAudio, // Guardamos la URL directa del audio como ID
                titulo: tituloLimpio,
                artista: cancion.primaryArtists || "Artista Desconocido",
                portada: portadaHD
            });
        } else {
            res.status(404).json({ error: "No se encontró música" });
        }
    } catch (error) {
        console.error("Error buscando en la API de música:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// ENDPOINT 2: El Streamer Directo
app.get('/api/stream', (req, res) => {
    try {
        const enlaceAudio = req.query.id;
        if (!enlaceAudio) return res.status(400).send("Falta el enlace de la canción");

        // Como ahora extraemos la URL de audio directo de alta calidad de los servidores oficiales,
        // simplemente redirigimos tu reproductor web hacia allá. ¡Carga instantánea!
        res.redirect(enlaceAudio);

    } catch (error) {
        console.error("Error transmitiendo:", error);
        res.status(500).send("Error al cargar el audio");
    }
});

// Encendemos el motor
const PUERTO = process.env.PORT || 3000;
app.listen(PUERTO, () => {
    console.log(`Motor de GhostMusic encendido en el puerto ${PUERTO} conectado a red oficial.`);
});
