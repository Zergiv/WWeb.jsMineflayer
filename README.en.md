# wwebjmineflayer

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat)
![License](https://img.shields.io/badge/License-ISC-blue?style=flat)
![Minecraft](https://img.shields.io/badge/Minecraft-1.20.1-62B47A?style=flat)
![Made with AI](https://img.shields.io/badge/Made%20with-AI-8B5CF6?style=flat)

Control a **Minecraft** bot (Mineflayer) from **WhatsApp** using voice messages.

> **Default language:** [README.md](README.md) (Spanish)

## Language support

**Not limited to Spanish.**

- **Gemini** transcribes audio in [many languages](https://ai.google.dev/gemini-api/docs/models).
- **Built-in commands** use Spanish-tuned keyword rules; similar phrases in other languages often work after transcription.
- **Ollama** handles unusual requests; pick a model that understands your language.

## How it works

1. **WhatsApp** accepts voice notes from your whitelisted number only.
2. **Gemini** turns audio into text.
3. Common orders → built-in rules (no LLM).
4. Complex orders → **Ollama** generates sandboxed Mineflayer code.

## Requirements

- [Node.js](https://nodejs.org/) 18+
- **Minecraft 1.20.1** server (offline / LAN is fine)
- [Ollama](https://ollama.com/) — **model depends on your hardware**
- [Google AI Studio](https://aistudio.google.com/apikey) API key
- WhatsApp on your phone (QR link)

### Choosing an Ollama model

| Your setup | Suggestion |
|------------|------------|
| 8 GB RAM, no GPU | `llama3.2:3b` or similar |
| 16 GB RAM | `llama3.1:8b` (default in `.env.example`) |
| GPU + enough VRAM | `llama3.1:8b` or larger |

Set `OLLAMA_MODEL` in `.env`. If CUDA fails: `OLLAMA_NUM_GPU=0`.

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

## Usage

```bash
npm start
```

| Command | Action |
|---------|--------|
| `!ping` | Check the bot |
| `!mineflayer` | Toggle voice mode |
| `!estado` | Status |

Voice examples: “follow me”, “stop”, “collect wood”, “kill zombies” — or Spanish: “sígueme”, “para”, “recolecta madera”.

**PM2:** `npm run pm2:start` · `npm run pm2:logs` · `npm run pm2:restart`

## License

ISC
