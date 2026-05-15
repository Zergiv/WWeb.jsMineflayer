# wwebjmineflayer

![Node](https://img.shields.io/badge/node-%3E%3D%18-339933?style=flat&logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/license-ISC-blue?style=flat)
![Minecraft](https://img.shields.io/badge/Minecraft-1.20.1-62B47A?style=flat)
![Made with AI](https://img.shields.io/badge/Made%20with-AI-8B5CF6?style=flat)

Controla un bot de **Minecraft** (Mineflayer) desde **WhatsApp** con mensajes de voz en español.

Escaneas QR, activas el modo con un comando, mandas audios con órdenes y el personaje obedece en el servidor: seguirte, parar, recolectar madera, atacar mobs, etc.

## Qué hace

1. **WhatsApp** (`whatsapp-web.js`) recibe audios solo del número que configures.
2. **Gemini** transcribe el audio a texto.
3. Órdenes habituales se ejecutan con reglas en español (sin LLM).
4. Órdenes raras pasan por **Ollama** (`llama3.1:8b`), que genera código Mineflayer acotado.

## Requisitos

- [Node.js](https://nodejs.org/) 18+
- Servidor **Minecraft 1.20.1** (modo offline / LAN está bien)
- [Ollama](https://ollama.com/) con `llama3.1:8b` (solo para órdenes no estándar)
- API key de [Google AI Studio](https://aistudio.google.com/apikey) (Gemini, transcripción)
- WhatsApp en el móvil para vincular sesión (QR)

## Instalación

```bash
git clone https://github.com/TU_USUARIO/wwebjmineflayer.git
cd wwebjmineflayer
npm install
cp .env.example .env
```

Edita `.env` con tus valores (nunca subas `.env` al repo):

| Variable | Descripción |
|----------|-------------|
| `ALLOWED_PHONE` | Tu número en formato internacional sin `+` (ej. `34612345678`) |
| `GEMINI_API_KEY` | Clave de Gemini |
| `GEMINI_TRANSCRIBE_MODEL` | Por defecto `gemini-3.1-flash-lite-preview` |
| `MC_HOST` / `MC_PORT` | IP y puerto del servidor |
| `MC_USERNAME` | Nombre del bot en el juego |
| `OLLAMA_NUM_GPU` | `0` si CUDA falla en tu PC |

## Uso

**Arranque simple**

```bash
npm start
```

Escanea el QR en la terminal. En WhatsApp (chat contigo o el número vinculado):

| Comando | Acción |
|---------|--------|
| `!ping` | Comprueba que el bot responde |
| `!mineflayer` | Activa / desactiva el modo voz → Minecraft |
| `!estado` | Estado de MC, Gemini y Ollama |

Con el modo activado, envía **notas de voz** con órdenes en español, por ejemplo:

- «Sígueme» / «Para»
- «Recolecta madera»
- «Mata zombies» / «Ataca animales»

**Producción con PM2**

```bash
npm run pm2:start
npm run pm2:logs
npm run pm2:restart
```

**Probar Ollama**

```bash
npm run ollama:check
```

## Estructura del proyecto

```
main.js                 # Cliente WhatsApp
src/
  handlers/             # Voz y comandos !
  minecraft/            # Bot MC, intenciones, acciones
  services/             # Gemini, Ollama
  auth/                 # Whitelist por número
ecosystem.config.cjs    # PM2
```

## Notas

- El bot debe estar en el **mismo servidor** que tú y verte cerca para seguirte.
- Gemini tiene **límites de cuota** en el plan gratuito; si ves error 429, espera un momento.
- WhatsApp Web no es API oficial: úsalo bajo tu responsabilidad.
- **No compartas** `.env`, sesión `.wwebjs_auth/` ni API keys.

## Licencia

ISC
