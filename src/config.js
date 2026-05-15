require('dotenv').config();

const config = {
    allowedPhone: (process.env.ALLOWED_PHONE || '').replace(/\D/g, ''),
    mc: {
        host: process.env.MC_HOST || 'localhost',
        port: Number(process.env.MC_PORT || 25565),
        version: process.env.MC_VERSION || '1.20.1',
        username: process.env.MC_USERNAME || 'Pruebas',
    },
    gemini: {
        apiKey: process.env.GEMINI_API_KEY || '',
        transcribeModel:
            process.env.GEMINI_TRANSCRIBE_MODEL || 'gemini-3.1-flash-lite-preview',
    },
    ollama: {
        url: (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, ''),
        model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
        healthTimeoutMs: 3000,
        chatTimeoutMs: Number(process.env.OLLAMA_CHAT_TIMEOUT_MS || 90000),
        /** 0 = solo CPU (útil si CUDA falla). Sin definir = Ollama elige GPU/CPU. */
        numGpu:
            process.env.OLLAMA_NUM_GPU !== undefined && process.env.OLLAMA_NUM_GPU !== ''
                ? Number(process.env.OLLAMA_NUM_GPU)
                : undefined,
    },
};

module.exports = config;
