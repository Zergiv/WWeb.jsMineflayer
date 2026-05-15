# wwebjmineflayer

**English** · [Español](README.es.md)

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat)
![License](https://img.shields.io/badge/License-ISC-blue?style=flat)
![Minecraft](https://img.shields.io/badge/Minecraft-1.20.1-62B47A?style=flat)
![Made with AI](https://img.shields.io/badge/Made%20with-AI-8B5CF6?style=flat)

Control a **Minecraft** bot (Mineflayer) from **WhatsApp** using voice messages.

Scan the QR code, enable voice mode, send audio commands, and your in-game character follows, stops, chops wood, fights mobs, and more.

## Language support

**You are not limited to Spanish.**

- **Gemini** transcribes audio in [many languages](https://ai.google.dev/gemini-api/docs/models) — speak in English, Spanish, or whatever Gemini supports.
- **Built-in commands** (follow, stop, wood, attack) use keyword rules tuned with Spanish examples, but similar phrases in other languages often work once transcribed.
- **Ollama** handles unusual requests; pick a model that understands the language you speak.

## How it works

1. **WhatsApp** (`whatsapp-web.js`) accepts voice notes from your whitelisted number only.
2. **Gemini** turns audio into text.
3. Common orders run via built-in rules (no LLM).
4. Complex orders go through **Ollama**, which generates sandboxed Mineflayer code.

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer
- **Minecraft 1.20.1** server (offline / LAN is fine)
- [Ollama](https://ollama.com/) — **model depends on your hardware** (see below)
- [Google AI Studio](https://aistudio.google.com/apikey) API key (Gemini transcription)
- WhatsApp on your phone to link the session (QR)

### Choosing an Ollama model

There is no single required model. Use whatever fits **your CPU, RAM, and GPU**:

| Your setup | Suggestion |
|------------|------------|
| 8 GB RAM, no GPU | `llama3.2:3b` or similar small model |
| 16 GB RAM | `llama3.1:8b` (default in `.env.example`) |
| GPU + 16 GB+ VRAM | `llama3.1:8b` or larger if it runs smoothly |

Set `OLLAMA_MODEL` in `.env`. If CUDA fails, use `OLLAMA_NUM_GPU=0` for CPU-only.

Verify with:

```bash
npm run ollama:check
```

## Installation

```bash
git clone https://github.com/YOUR_USER/wwebjmineflayer.git
cd wwebjmineflayer
npm install
cp .env.example .env
```

Edit `.env` with your values — **never commit `.env`**:

| Variable | Description |
|----------|-------------|
| `ALLOWED_PHONE` | Your phone number, international format without `+` |
| `GEMINI_API_KEY` | Gemini API key |
| `GEMINI_TRANSCRIBE_MODEL` | Default: `gemini-3.1-flash-lite-preview` |
| `OLLAMA_MODEL` | Any model you can run locally |
| `MC_HOST` / `MC_PORT` | Server address |
| `MC_USERNAME` | Bot username in-game |
| `OLLAMA_NUM_GPU` | `0` to force CPU if GPU/CUDA fails |

## Usage

**Quick start**

```bash
npm start
```

Scan the QR in the terminal. In WhatsApp:

| Command | Action |
|---------|--------|
| `!ping` | Check the bot is alive |
| `!mineflayer` | Toggle voice → Minecraft mode |
| `!estado` | MC, Gemini, and Ollama status |

With mode enabled, send **voice notes**, for example:

- “Follow me” / “Stop”
- “Collect wood”
- “Kill zombies” / “Attack animals”

(Spanish works too: “sígueme”, “para”, “recolecta madera”, etc.)

**Production (PM2)**

```bash
npm run pm2:start
npm run pm2:logs
npm run pm2:restart
```

## Project layout

```
main.js                 # WhatsApp client
src/
  handlers/             # Voice + ! commands
  minecraft/            # Bot, intents, actions
  services/             # Gemini, Ollama
  auth/                 # Phone whitelist
ecosystem.config.cjs    # PM2
```

## Notes

- The bot must be on the **same server** as you and nearby to follow you.
- Gemini **free tier** has rate limits (HTTP 429); wait and retry.
- WhatsApp Web is not an official API — use at your own risk.
- Do **not** share `.env`, `.wwebjs_auth/`, or API keys.

## License

ISC
