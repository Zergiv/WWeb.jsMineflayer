function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

function isRetryableWaError(err) {
    const msg = err?.message || '';
    return (
        /Promise was collected/i.test(msg) ||
        /Protocol error/i.test(msg) ||
        /Execution context was destroyed/i.test(msg) ||
        /Target closed/i.test(msg) ||
        /Session closed/i.test(msg)
    );
}

/**
 * Reintenta reply cuando Puppeteer pierde la promesa (común con audios seguidos).
 * @param {import('whatsapp-web.js').Message} message
 * @param {string} text
 * @param {{ retries?: number }} [opts]
 */
async function safeReply(message, text, opts = {}) {
    const retries = opts.retries ?? 3;
    let lastErr;

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            await message.reply(text);
            return;
        } catch (err) {
            lastErr = err;
            if (!isRetryableWaError(err) || attempt === retries - 1) {
                throw err;
            }
            await sleep(400 * (attempt + 1));
        }
    }

    throw lastErr;
}

module.exports = { safeReply, isRetryableWaError };
