/**
 * Cola por clave: un trabajo a la vez (evita solapar Puppeteer en WhatsApp).
 * @param {string} key
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
function runQueued(key, fn) {
    const prev = queues.get(key) || Promise.resolve();
    const run = prev
        .catch(() => {})
        .then(() => fn());
    queues.set(
        key,
        run.finally(() => {
            if (queues.get(key) === run) queues.delete(key);
        })
    );
    return run;
}

const queues = new Map();

module.exports = { runQueued };
