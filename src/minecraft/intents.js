const { normalize } = require('./intents-normalize');

function extractQuantity(text, defaultQty = 16) {
    const m = text.match(/\b(\d{1,3})\b/);
    if (!m) return defaultQty;
    return Math.min(64, Math.max(1, parseInt(m[1], 10)));
}

function woodTypeFromText(text) {
    if (/jungl/.test(text)) return 'jungle_log';
    if (/junípero|junipero|juniper/.test(text)) return 'spruce_log';
    if (/abedul|birch/.test(text)) return 'birch_log';
    if (/abeto|spruce|pino/.test(text)) return 'spruce_log';
    if (/acaci/.test(text)) return 'acacia_log';
    if (/roble|oak/.test(text)) return 'oak_log';
    if (/oscuro|dark/.test(text)) return 'dark_oak_log';
    if (/cerezo|cherry/.test(text)) return 'cherry_log';
    return null;
}

function wantsFollow(t) {
    return (
        /\b(seguir|sigueme|sigue|follow)\b/.test(t) ||
        /\b(me sig|te sig|que me sig|que te sig|quiero que me sig|puedes seguir|podrias seguir)\b/.test(t) ||
        /\bsigas\b/.test(t) ||
        /ven conmigo/.test(t) ||
        /acompaname/.test(t)
    );
}

function wantsStop(t) {
    return (
        /\b(para|detente|stop|quieto|cancela|alto|deja de seguir)\b/.test(t) ||
        /\b(deja de talar|deja de recolect|para de talar|para de recolect)\b/.test(t)
    );
}

function wantsAttackAnimals(t) {
    return (
        /\b(animales?|ganado)\b/.test(t) ||
        /\b(vacas?|cerdos?|ovejas?|pollos?|caballos?|conejos?|cabras?)\b/.test(t) ||
        (/\b(mata|matar|atacar|ataca|elimina|pelea)\b/.test(t) && /\banimal/.test(t))
    );
}

function wantsAttack(t) {
    if (wantsAttackAnimals(t)) return false;
    return /\b(mata|matar|kill|ataca|elimina|pelea)\b/.test(t) || /\bzombie/.test(t);
}

function animalFromText(t) {
    if (/\bvacas?\b/.test(t)) return 'cow';
    if (/\bcerdos?\b/.test(t)) return 'pig';
    if (/\bovejas?\b/.test(t)) return 'sheep';
    if (/\bpollos?\b/.test(t)) return 'chicken';
    if (/\bcaballos?\b/.test(t)) return 'horse';
    if (/\bconejos?\b/.test(t)) return 'rabbit';
    if (/\bcabras?\b/.test(t)) return 'goat';
    return null;
}

function wantsWood(t) {
    return (
        /\b(madera|tronco|logs?|arbol|recolect|tala|talar|minar|trae|traeme|consegu)\b/.test(t)
    );
}

function wantsCome(t) {
    return (
        /\b(ven aqui|ve aqui|acercate|come here|vuelve)\b/.test(t) ||
        (/\bven\b/.test(t) && !/madera|tronco|talar/.test(t))
    );
}

/**
 * Varios comandos en un audio: "para y sigueme" → [stop, follow]
 * @returns {{ type: string, params: object }[]}
 */
function matchIntents(text) {
    const t = normalize(text);
    if (!t) return [];

    const intents = [];

    if (wantsStop(t)) intents.push({ type: 'stop', params: {} });
    if (wantsFollow(t)) intents.push({ type: 'follow', params: {} });
    if (wantsCome(t) && !wantsFollow(t)) intents.push({ type: 'come', params: {} });
    if (wantsAttackAnimals(t)) {
        intents.push({
            type: 'attack_animals',
            params: { species: animalFromText(t), max: 8 },
        });
    } else if (wantsAttack(t)) {
        intents.push({
            type: 'attack',
            params: { hostile: /\bzombie/.test(t) ? 'zombie' : 'any', max: 8 },
        });
    }
    if (wantsWood(t) && !wantsStop(t) && !wantsAttackAnimals(t)) {
        intents.push({
            type: 'collect_wood',
            params: { block: woodTypeFromText(t), quantity: extractQuantity(t, 16) },
        });
    }

    if (intents.length > 0) return intents;

    return [];
}

function matchIntent(text) {
    const list = matchIntents(text);
    if (list.length === 1) return list[0];
    if (list.length > 1) return null;
    return null;
}

function inferIntentFromText(text) {
    const list = matchIntents(text);
    return list[0] || null;
}

module.exports = { matchIntent, matchIntents, inferIntentFromText, normalize, wantsFollow };
