const config = require('../config');

const loggedPeers = new Set();

function digitsOnly(value) {
    return String(value || '').replace(/\D/g, '');
}

function phoneMatches(digits) {
    const d = digitsOnly(digits);
    if (!d) return false;
    return d === config.allowedPhone || d.endsWith(config.allowedPhone);
}

/** Chat privado (no grupos). */
function isPrivateChat(chatId) {
    if (!chatId || typeof chatId !== 'string') return false;
    if (chatId.endsWith('@g.us')) return false;
    return (
        chatId.endsWith('@c.us') ||
        chatId.endsWith('@lid') ||
        chatId.endsWith('@s.whatsapp.net')
    );
}

async function resolveAllowedPeer(message, chatId) {
    if (!isPrivateChat(chatId)) return false;

    if (phoneMatches(chatId)) return true;

    if (!message?.client) return false;

    try {
        const contact = await message.client.getContactById(chatId);
        const num = contact?.number || contact?.id?.user;
        if (phoneMatches(num)) return true;
    } catch {
        /* contacto no resuelto */
    }

    if (chatId.endsWith('@lid')) {
        try {
            const rows = await message.client.getContactLidAndPhone([chatId]);
            const pn = rows?.[0]?.pn;
            if (pn && phoneMatches(pn)) return true;
        } catch {
            /* LID sin teléfono */
        }
    }

    return false;
}

/**
 * Mensajes permitidos: solo tu número, chat privado.
 * Incluye mensajes enviados desde el móvil (fromMe) — antes se ignoraban por error.
 */
async function isAllowedMessage(message) {
    if (!message) return false;

    const peerIds = new Set();
    if (message.from) peerIds.add(message.from);
    if (message.to) peerIds.add(message.to);
    if (message.author) peerIds.add(message.author);

    for (const peerId of peerIds) {
        if (await resolveAllowedPeer(message, peerId)) return true;
    }

    return false;
}

function logSkipped(message) {
    const key = `${message.fromMe}|${message.from}|${message.to}`;
    if (loggedPeers.has(key)) return;
    loggedPeers.add(key);

    console.warn(
        '[WA] Mensaje no procesado:',
        JSON.stringify({
            fromMe: message.fromMe,
            from: message.from,
            to: message.to,
            type: message.type,
            body: (message.body || '').slice(0, 40),
            esperado: `+${config.allowedPhone}`,
        })
    );
}

module.exports = { isAllowedMessage, logSkipped, isPrivateChat, phoneMatches };
