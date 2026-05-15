# wwebjmineflayer

**Español** · [English](README.md)

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat)
![License](https://img.shields.io/badge/License-ISC-blue?style=flat)
![Minecraft](https://img.shields.io/badge/Minecraft-1.20.1-62B47A?style=flat)
![Made with AI](https://img.shields.io/badge/Made%20with-AI-8B5CF6?style=flat)

Controla un bot de **Minecraft** (Mineflayer) desde **WhatsApp** con mensajes de voz.

Escaneas el QR, activas el modo, mandas audios con órdenes y el personaje obedece en el servidor.

## Idiomas

**No está limitado al español.**

- **Gemini** transcribe audio en [muchos idiomas](https://ai.google.dev/gemini-api/docs/models): inglés, español, etc.
- Las **órdenes integradas** (seguir, parar, madera, atacar) usan reglas con ejemplos en español, pero frases parecidas en otros idiomas suelen funcionar tras la transcripción.
- **Ollama** resuelve peticiones raras; elige un modelo que entienda el idioma en el que hables.

## Qué hace

1. **WhatsApp** recibe audios solo del número que configures.
2. **Gemini** convierte el audio en texto.
3. Órdenes habituales → reglas integradas (sin LLM).
4. Órdenes raras → **Ollama** genera código Mineflayer acotado.

## Requisitos

- [Node.js](https://nodejs.org/) 18 o superior
- Servidor **Minecraft 1.20.1** (offline / LAN vale)
- [Ollama](https://ollama.com/) — **el modelo depende de tu equipo** (abajo)
- API key de [Google AI Studio](https://aistudio.google.com/apikey)
- WhatsApp en el móvil para vincular (QR)

### Qué modelo de Ollama usar

No hay un modelo obligatorio. Usa el que puedas ejecutar según **RAM, CPU y GPU**:

| Tu PC | Sugerencia |
|-------|------------|
| 8 GB RAM, sin GPU | `llama3.2:3b` u otro pequeño |
| 16 GB RAM | `llama3.1:8b` (por defecto en `.env.example`) |
| GPU con VRAM suficiente | `llama3.1:8b` o mayor si va fluido |

Configura `OLLAMA_MODEL` en `.env`. Si falla CUDA: `OLLAMA_NUM_GPU=0`.

```bash
npm run ollama:check
```

## Instalación

```bash
git clone https://github.com/TU_USUARIO/wwebjmineflayer.git
cd wwebjmineflayer
npm install
cp .env.example .env
```

Edita `.env` (nunca lo subas al repo):

| Variable | Descripción |
|----------|-------------|
| `ALLOWED_PHONE` | Tu número sin `+` |
| `GEMINI_API_KEY` | Clave Gemini |
| `GEMINI_TRANSCRIBE_MODEL` | Por defecto `gemini-3.1-flash-lite-preview` |
| `OLLAMA_MODEL` | El que puedas correr en tu máquina |
| `MC_HOST` / `MC_PORT` | Servidor |
| `MC_USERNAME` | Nombre del bot |
| `OLLAMA_NUM_GPU` | `0` si CUDA falla |

## Uso

```bash
npm start
```

| Comando | Acción |
|---------|--------|
| `!ping` | Comprueba respuesta |
| `!mineflayer` | Activa / desactiva modo voz |
| `!estado` | Estado MC, Gemini, Ollama |

Con el modo activo, envía **notas de voz**, por ejemplo:

- «Sígueme» / «Para»
- «Recolecta madera»
- «Mata zombies»

(También en inglés: “follow me”, “stop”, “collect wood”, etc.)

**PM2**

```bash
npm run pm2:start
npm run pm2:logs
npm run pm2:restart
```

## Estructura

```
main.js
src/handlers/      # Voz y comandos !
src/minecraft/       # Bot, intenciones, acciones
src/services/        # Gemini, Ollama
ecosystem.config.cjs
```

## Notas

- Mismo servidor que tú y cerca para seguirte.
- Cuota gratuita de Gemini (error 429): espera y reintenta.
- WhatsApp Web no es API oficial.
- No compartas `.env` ni `.wwebjs_auth/`.

## Licencia

ISC
