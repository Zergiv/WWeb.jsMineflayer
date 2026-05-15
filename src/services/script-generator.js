const config = require('../config');
const { formatOllamaError } = require('./ollama-errors');

const SYSTEM_PROMPT = `Generas código Mineflayer 1.20.1 SOLO si la orden no es estándar.
Responde SOLO JSON: {"reply":"mensaje corto español","code":"código o cadena vacía"}

Si la orden es seguir/parar/madera/zombies/animales, deja "code" vacío "" (ya hay acciones built-in).

Helpers disponibles (NO uses mcData ni bot.registry directamente):
- followPlayer()
- stopMoving()
- gotoNear(x,y,z, range?)
- digBlockAt(x,y,z)
- findBlocksByNames(['oak_log'], maxDist?, count?)
- blockId('oak_log')
- nearestPlayer()
- attackAnimals(max?) — matar vacas, cerdos, etc.
- attackEntity(entity) — equivale a bot.attack(entity)
- bot, goals, Vec3

NUNCA uses bot.attackEntity (no existe). Para golpear: attackEntity(entidad) o bot.attack(entidad).

Sin require/import. Máximo 40 líneas en code.`;

function chatOptions() {
    const opts = {
        temperature: 0.1,
        num_predict: 500,
        num_ctx: 4096,
    };
    if (config.ollama.numGpu !== undefined && !Number.isNaN(config.ollama.numGpu)) {
        opts.num_gpu = config.ollama.numGpu;
    }
    return opts;
}

async function isOllamaAvailable() {
    try {
        const res = await fetch(`${config.ollama.url}/api/tags`, {
            signal: AbortSignal.timeout(config.ollama.healthTimeoutMs),
        });
        return res.ok;
    } catch {
        return false;
    }
}

async function isModelPulled() {
    try {
        const res = await fetch(`${config.ollama.url}/api/tags`, {
            signal: AbortSignal.timeout(config.ollama.healthTimeoutMs),
        });
        if (!res.ok) return false;
        const data = await res.json();
        const name = config.ollama.model;
        return (data.models || []).some(
            (m) =>
                m.name === name ||
                m.name.startsWith(`${name}:`) ||
                m.model === name ||
                m.name.startsWith(name)
        );
    } catch {
        return false;
    }
}

function extractJson(raw) {
    const trimmed = raw.trim();
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    const candidate = fence ? fence[1].trim() : trimmed;
    return JSON.parse(candidate);
}

async function generateScript(userText) {
    const res = await fetch(`${config.ollama.url}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: config.ollama.model,
            stream: false,
            format: 'json',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userText },
            ],
            options: chatOptions(),
        }),
        signal: AbortSignal.timeout(config.ollama.chatTimeoutMs),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(formatOllamaError(res.status, body));
    }

    const data = await res.json();
    const raw = data.message?.content?.trim() || '{}';
    let parsed;
    try {
        parsed = extractJson(raw);
    } catch {
        throw new Error(`Modelo no devolvió JSON válido: ${raw.slice(0, 300)}`);
    }

    return {
        reply: parsed.reply || 'Hecho.',
        code: (parsed.code || '').trim(),
    };
}

module.exports = { isOllamaAvailable, isModelPulled, generateScript };
