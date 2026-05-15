const fs = require('fs');
const path = require('path');
const {
    GoogleGenAI,
    createPartFromUri,
    createPartFromBase64,
    createUserContent,
} = require('@google/genai');
const config = require('../config');

let client;

function getClient() {
    if (!config.gemini.apiKey) {
        throw new Error('Falta GEMINI_API_KEY en .env');
    }
    if (!client) {
        client = new GoogleGenAI({ apiKey: config.gemini.apiKey });
    }
    return client;
}

const MIME_BY_EXT = {
    '.ogg': 'audio/ogg',
    '.opus': 'audio/ogg',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
    '.mp4': 'audio/mp4',
    '.webm': 'audio/webm',
};

function mimeForPath(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return MIME_BY_EXT[ext] || 'audio/ogg';
}

const PROMPT =
    'Transcribe this audio to Spanish. Return ONLY the spoken words, no quotes or explanation.';

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

function parseRetrySeconds(err) {
    const msg = err?.message || String(err);
    const m = msg.match(/retry in (\d+(?:\.\d+)?)s/i);
    return m ? Math.ceil(Number(m[1]) * 1000) + 500 : 30_000;
}

function formatGeminiError(err) {
    const msg = err?.message || String(err);
    if (/429|RESOURCE_EXHAUSTED|quota/i.test(msg)) {
        const retrySec = Math.ceil(parseRetrySeconds(err) / 1000);
        return (
            `Cuota de Gemini agotada (modelo: ${config.gemini.transcribeModel}). ` +
            `Espera ~${retrySec}s y vuelve a enviar el audio. ` +
            `Límite free tier: revisa https://ai.google.dev/gemini-api/docs/rate-limits`
        );
    }
    if (/404|not found|invalid model/i.test(msg)) {
        return (
            `Modelo Gemini no válido: ${config.gemini.transcribeModel}. ` +
            `En .env usa: GEMINI_TRANSCRIBE_MODEL=gemini-3.1-flash-lite-preview`
        );
    }
    return msg.length > 400 ? `${msg.slice(0, 400)}…` : msg;
}

async function withGeminiRetry(fn, maxAttempts = 2) {
    let lastErr;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastErr = err;
            const msg = err?.message || '';
            if (!/429|RESOURCE_EXHAUSTED|quota/i.test(msg) || attempt === maxAttempts - 1) {
                throw err;
            }
            await sleep(parseRetrySeconds(err));
        }
    }
    throw lastErr;
}

async function waitForFileActive(ai, file) {
    let current = file;
    const deadline = Date.now() + 90_000;

    while (current.state === 'PROCESSING' && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 1500));
        current = await ai.files.get({ name: file.name });
    }

    if (current.state === 'FAILED') {
        throw new Error('Gemini no pudo procesar el archivo de audio');
    }
    if (!current.uri) {
        throw new Error('El archivo subido no tiene URI válida');
    }

    return current;
}

async function transcribeViaUpload(ai, filePath, mimeType) {
    let uploaded = await ai.files.upload({
        file: filePath,
        config: { mimeType },
    });

    uploaded = await waitForFileActive(ai, uploaded);

    try {
        const response = await ai.models.generateContent({
            model: config.gemini.transcribeModel,
            contents: createUserContent([
                PROMPT,
                createPartFromUri(uploaded.uri, uploaded.mimeType || mimeType),
            ]),
        });
        return (response.text || '').trim();
    } finally {
        if (uploaded.name) {
            ai.files.delete({ name: uploaded.name }).catch(() => {});
        }
    }
}

async function transcribeViaInline(ai, filePath, mimeType) {
    const data = fs.readFileSync(filePath).toString('base64');
    const response = await ai.models.generateContent({
        model: config.gemini.transcribeModel,
        contents: createUserContent([
            PROMPT,
            createPartFromBase64(data, mimeType),
        ]),
    });
    return (response.text || '').trim();
}

/**
 * @param {string} filePath
 * @returns {Promise<{ text: string }>}
 */
async function transcribeFile(filePath) {
    const ai = getClient();
    const mimeType = mimeForPath(filePath);
    const size = fs.statSync(filePath).size;

    try {
        const text = await withGeminiRetry(async () => {
            if (size <= 15 * 1024 * 1024) {
                return transcribeViaInline(ai, filePath, mimeType);
            }
            return transcribeViaUpload(ai, filePath, mimeType);
        });
        return { text };
    } catch (err) {
        throw new Error(formatGeminiError(err));
    }
}

function isGeminiConfigured() {
    return Boolean(config.gemini.apiKey);
}

module.exports = { transcribeFile, isGeminiConfigured };
