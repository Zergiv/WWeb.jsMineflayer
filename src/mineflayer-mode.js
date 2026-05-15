/** Estado del modo Mineflayer por chat (solo procesa audios cuando está activo). */
const enabledChats = new Set();

function isEnabled(chatId) {
    return enabledChats.has(chatId);
}

function toggle(chatId) {
    if (enabledChats.has(chatId)) {
        enabledChats.delete(chatId);
        return false;
    }
    enabledChats.add(chatId);
    return true;
}

module.exports = { isEnabled, toggle };
