const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const config = require('../config');
const { initTaskManager, shutdownTaskManager } = require('./task-manager');

let bot = null;
let ready = false;

function getBot() {
    return bot;
}

function isReady() {
    return ready && bot?.entity;
}

function connect() {
    if (bot) return bot;

    bot = mineflayer.createBot({
        host: config.mc.host,
        port: config.mc.port,
        username: config.mc.username,
        auth: 'offline',
        version: config.mc.version,
    });

    bot.loadPlugin(pathfinder);

    bot.once('spawn', () => {
        ready = true;
        const mcData = require('minecraft-data')(bot.version);
        const movements = new Movements(bot, mcData);
        movements.canDig = true;
        movements.allow1by1towers = true;
        bot.pathfinder.setMovements(movements);
        initTaskManager(bot);
        console.log(
            `[MC] ${config.mc.username} en ${config.mc.host}:${config.mc.port} (${config.mc.version})`
        );
    });

    bot.on('end', () => {
        ready = false;
        shutdownTaskManager();
        console.warn('[MC] Desconectado. Reintento en 15s…');
        bot = null;
        setTimeout(connect, 15000);
    });

    bot.on('error', (err) => {
        console.error('[MC] Error:', err.message);
    });

    bot.on('kicked', (reason) => {
        console.warn('[MC] Expulsado:', reason);
    });

    return bot;
}

module.exports = { connect, getBot, isReady, goals };
