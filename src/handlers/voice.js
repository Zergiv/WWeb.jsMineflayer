const fs = require('fs');
const path = require('path');
const mineflayerMode = require('../mineflayer-mode');
const { getChatKey } = require('../utils/chat');
const { runQueued } = require('../utils/async-queue');
const { safeReply } = require('../utils/wa-reply');
const { transcribeFile, isGeminiConfigured } = require('../services/gemini-transcribe');
const { isOllamaAvailable, isModelPulled } = require('../services/script-generator');
const { executeVoiceCommand } = require('../minecraft/executor');
const { matchIntents } = require('../minecraft/intents');
const { cancelAllActions } = require('../minecraft/action-controller');

const TMP_DIR = path.join(__dirname, '../../.tmp/audio');

function isVoiceMessage(message) {
    return message.type === 'ptt' || message.type === 'audio';
}

function extensionFromMimetype(mimetype) {
    if (!mimetype) return '.ogg';
    if (mimetype.includes('ogg')) return '.ogg';
    if (mimetype.includes('mpeg') || mimetype.includes('mp3')) return '.mp3';
    if (mimetype.includes('wav')) return '.wav';
    if (mimetype.includes('mp4') || mimetype.includes('m4a')) return '.m4a';
    return '.ogg';
}

async function saveVoiceMedia(message) {
    const media = await message.downloadMedia();
    if (!media?.data) {
        throw new Error('No se pudo descargar el audio');
    }

    fs.mkdirSync(TMP_DIR, { recursive: true });
    const ext = extensionFromMimetype(media.mimetype);
    const filePath = path.join(TMP_DIR, `${message.id._serialized || Date.now()}${ext}`);
    fs.writeFileSync(filePath, Buffer.from(media.data, 'base64'));
    return filePath;
}

async function processVoiceMessage(message) {
    const chatId = getChatKey(message);
    if (!mineflayerMode.isEnabled(chatId)) return false;

    if (!isGeminiConfigured()) {
        await safeReply(message, 'Falta GEMINI_API_KEY en el archivo .env');
        return true;
    }

    let filePath;
    let finalSent = false;

    try {
        await safeReply(message, 'Procesando…');
        filePath = await saveVoiceMedia(message);

        const { text } = await transcribeFile(filePath);
        if (!text) {
            await safeReply(message, 'No se entendió el audio.');
            finalSent = true;
            return true;
        }

        const needsOllama = matchIntents(text).length === 0;

        if (needsOllama) {
            if (!(await isOllamaAvailable())) {
                await safeReply(
                    message,
                    `Escuché: _${text}_\n\nOllama no está activo. Instálalo y ejecuta:\nollama pull llama3.1:8b`
                );
                finalSent = true;
                return true;
            }

            if (!(await isModelPulled())) {
                await safeReply(
                    message,
                    `Escuché: _${text}_\n\nFalta el modelo. Ejecuta:\nollama pull llama3.1:8b`
                );
                finalSent = true;
                return true;
            }
        }

        const result = await executeVoiceCommand(text);
        await safeReply(message, `_${text}_\n\n${result}`);
        finalSent = true;
        console.log('[voz]', text, '→', result.slice(0, 80));
        return true;
    } catch (err) {
        console.error('[voz]', err);
        if (!finalSent) {
            try {
                await safeReply(message, `Error: ${err.message}`);
            } catch (replyErr) {
                console.error('[voz] no se pudo enviar error al chat:', replyErr.message);
            }
        } else {
            console.warn('[voz] orden OK pero falló un reply de WhatsApp:', err.message);
        }
        return true;
    } finally {
        if (filePath) {
            fs.unlink(filePath, () => {});
        }
    }
}

async function handleVoice(message) {
    if (!isVoiceMessage(message)) return false;

    const chatId = getChatKey(message);
    if (!mineflayerMode.isEnabled(chatId)) return false;

    // Cortar recolectar/atacar en cuanto llega otro audio (no esperar a transcribir)
    cancelAllActions();
    console.log('[voz] nuevo audio → cancelando tarea MC en curso');

    await runQueued(`voice:${chatId}`, () => processVoiceMessage(message));
    return true;
}

module.exports = { handleVoice, isVoiceMessage };
