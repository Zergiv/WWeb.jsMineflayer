/** ID estable del chat (funciona con mensajes enviados desde el móvil). */
function getChatKey(message) {
    if (message.fromMe && message.to) return message.to;
    return message.from;
}

module.exports = { getChatKey };
