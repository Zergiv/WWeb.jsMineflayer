const config = require('../config');
const mineflayerMode = require('../mineflayer-mode');
const { getChatKey } = require('../utils/chat');
const { isReady } = require('../minecraft/bot');
const { isGeminiConfigured } = require('../services/gemini-transcribe');
const { isOllamaAvailable, isModelPulled } = require('../services/script-generator');

async function handleCommand(message) {
    const body = (message.body || '').trim();
    const chatId = getChatKey(message);

    if (body === '!ping') {
        const mc = isReady() ? 'MC conectado' : 'MC desconectado';
        await message.reply(`pong (${mc})`);
        return true;
    }

    if (body === '!mineflayer') {
        const on = mineflayerMode.toggle(chatId);
        await message.reply(
            on
                ? 'Modo Mineflayer *activado*. Envía audios con órdenes.'
                : 'Modo Mineflayer *desactivado*.'
        );
        return true;
    }

    if (body === '!estado') {
        const mc = isReady() ? 'conectado' : 'desconectado';
        const mode = mineflayerMode.isEnabled(chatId) ? 'ON' : 'OFF';
        const gemini = isGeminiConfigured() ? config.gemini.transcribeModel : 'sin API key';
        let llm = 'Ollama apagado';
        if (await isOllamaAvailable()) {
            llm = (await isModelPulled())
                ? config.ollama.model
                : `falta → ollama pull ${config.ollama.model}`;
        }
        await message.reply(`MC: ${mc} | Voz: ${mode}\nGemini: ${gemini}\nScripts: ${llm}`);
        return true;
    }

    return false;
}

module.exports = { handleCommand };
