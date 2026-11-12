require('dotenv').config();
const tmi = require('tmi.js');
const axios = require('axios');

// Configuración de Riot
const RIOT_REGION = process.env.RIOT_REGION || 'la2';
const RIOT_ROUTING = process.env.RIOT_ROUTING || 'americas';
const riotHeaders = { headers: { "X-Riot-Token": process.env.RIOT_API_KEY } };

// División segura del nombre y tag (protegido contra valores vacíos o mal formados)
const rawRiotName = process.env.RIOT_SUMMONER_NAME || "";
const [gameName, tagLine] = rawRiotName.includes('#') 
    ? rawRiotName.split('#') 
    : [rawRiotName, "LAS"];

const client = new tmi.Client({
    options: { debug: true },
    identity: {
        username: process.env.TWITCH_USERNAME,
        password: process.env.TWITCH_OAUTH
    },
    channels: [process.env.TWITCH_CHANNEL]
});

// Variables de estado
let puuid = null;
let lastGameId = null;

// 1. Obtener el PUUID al encender el bot
async function initRiotData() {
    try {
        const encodedGameName = encodeURIComponent(gameName.trim());
        const encodedTagLine = encodeURIComponent(tagLine.trim());
        
        const accountUrl = `https://${RIOT_ROUTING}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodedGameName}/${encodedTagLine}`;
        const accountRes = await axios.get(accountUrl, riotHeaders);
        
        puuid = accountRes.data.puuid;
    } catch (error) {
        if (error.response) {
            console.error(`❌ Error de la API de Riot (Código ${error.response.status}):`, error.response.data);
        } else {
            console.error("❌ Error al buscar al jugador en la API de Riot:", error.message);
        }
    }
}

// 2. Revisar si hay una partida nueva (cada minuto)
async function checkGameStatus() {
    if (!puuid) return;

    try {
        const spectatorUrl = `https://${RIOT_REGION}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`;
        const spectatorRes = await axios.get(spectatorUrl, riotHeaders);
        const currentGameId = spectatorRes.data.gameId;

        // Si es una partida NUEVA
        if (currentGameId !== lastGameId) {
            lastGameId = currentGameId;

            // Datos del jugador actual
            const playerInfo = spectatorRes.data.participants.find(p => p.puuid === puuid);
            const championId = playerInfo.championId;
            const summonerId = playerInfo.summonerId;

            // A. Obtener nombre del campeón
            const versionRes = await axios.get('https://ddragon.leagueoflegends.com/api/versions.json');
            const champsRes = await axios.get(`https://ddragon.leagueoflegends.com/cdn/${versionRes.data[0]}/data/es_AR/champion.json`);
            const champions = champsRes.data.data;
            
            let championName = "desconocido";
            for (let champ in champions) {
                if (champions[champ].key == championId) {
                    championName = champions[champ].name.toLowerCase();
                    break;
                }
            }

            // B. Obtener Elo y Winrate de SoloQ
            let winrate = "N/A";
            let elo = "unranked";
            try {
                const leagueUrl = `https://${RIOT_REGION}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`;
                const leagueRes = await axios.get(leagueUrl, riotHeaders);
                const soloQ = leagueRes.data.find(queue => queue.queueType === 'RANKED_SOLO_5x5');
                
                if (soloQ) {
                    elo = soloQ.tier.toLowerCase();
                    const totalGames = soloQ.wins + soloQ.losses;
                    winrate = Math.round((soloQ.wins / totalGames) * 100) + '%';
                }
            } catch (err) {
                console.error("No se pudo obtener el Elo/Winrate.");
            }

            // C. Enviar el mensaje con el formato exacto que pediste
            const channel = process.env.TWITCH_CHANNEL;
            const mensaje = `🎮 pick: ${championName} - winrate: ${winrate} - elo lobby: ${elo} 🎮`;
            
            client.say(channel, mensaje);
        } 

    } catch (error) {
        if (error.response && error.response.status === 404) {
            // El jugador no está en partida. Reseteamos el ID para detectar la siguiente.
            lastGameId = null;
        } else {
            console.error("Error al revisar la partida:", error.message);
        }
    }
}

// 3. Conectar e iniciar bucle
client.connect();

client.on('connected', (address, port) => {
    initRiotData().then(() => {
        setInterval(checkGameStatus, 60000); // Revisa cada 60 segundos
    });
});