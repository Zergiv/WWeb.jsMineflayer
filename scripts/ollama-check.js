/**
 * Prueba Ollama (tags + un chat corto). Uso: node scripts/ollama-check.js
 */
require('dotenv').config();
const config = require('../src/config');
const { formatOllamaError } = require('../src/services/ollama-errors');

async function main() {
    const url = config.ollama.url;
    const model = config.ollama.model;
    console.log('Ollama URL:', url);
    console.log('Modelo:', model);
    console.log('OLLAMA_NUM_GPU:', config.ollama.numGpu ?? '(automático)');

    try {
        const tags = await fetch(`${url}/api/tags`);
        console.log('GET /api/tags:', tags.status, tags.ok ? 'OK' : 'FALLO');
    } catch (e) {
        console.error('No se conecta a Ollama. ¿Está corriendo? (ollama serve)');
        process.exit(1);
    }

    const opts = { temperature: 0, num_predict: 16 };
    if (config.ollama.numGpu !== undefined && !Number.isNaN(config.ollama.numGpu)) {
        opts.num_gpu = config.ollama.numGpu;
    }

    const res = await fetch(`${url}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model,
            stream: false,
            messages: [{ role: 'user', content: 'Di solo: ok' }],
            options: opts,
        }),
    });

    if (!res.ok) {
        const body = await res.text();
        console.error('\n' + formatOllamaError(res.status, body));
        process.exit(1);
    }

    const data = await res.json();
    console.log('Chat prueba OK:', data.message?.content?.trim() || '(vacío)');
}

main().catch((e) => {
    console.error(e.message);
    process.exit(1);
});
