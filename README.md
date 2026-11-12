# Twitch LoL Pick Bot

Bot de chat de Twitch en Node.js. Evita que el streamer tenga que responder "¿con quien jugas?" en cada partida: revisa cada minuto si entro a una partida de League of Legends y, cuando detecta una nueva, escribe en el chat el campeon, el winrate y el elo de SoloQ.

```
🎮 pick: jinx - winrate: 54% - elo lobby: emerald 🎮
```

## Live Deployment

> **Demo:** `[AGREGAR LINK AL CANAL O A UN CLIP DEL BOT FUNCIONANDO]`
>
> Es un proceso de Node que corre en local o en un servidor; no tiene URL publica.

## Tech Stack

Node.js · tmi.js · axios · Riot Games API (Account, Spectator, League) · Data Dragon

## Agentic Workflow

Este proyecto se construyo con desarrollo asistido por IA (Claude), con el autor dirigiendo, revisando y aprobando cada cambio.

- **Arquitectura de contexto:** un unico archivo con tres pasos claros (resolver el jugador, detectar partida nueva, publicar en el chat) y toda la configuracion fuera del codigo.
- **Directivas de seguridad:** ninguna credencial vive en el codigo. Antes de publicar se audito el repo completo (claves, tokens, rutas locales y datos de cuenta) y las credenciales se leen de un `.env` excluido por `.gitignore`.
- **Testing:** se valido manualmente contra partidas reales. Todavia no hay una suite de tests automatizados; es el siguiente paso pendiente.

## Local Setup

```bash
npm install
cp .env.example .env   # completar con tus credenciales
npm start
```

## Aviso

Este proyecto no esta respaldado por Riot Games. League of Legends es marca de Riot Games, Inc.
