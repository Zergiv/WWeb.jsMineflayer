/**
 * Tareas persistentes en tiempo real. Sin importar bot.js (evita dependencia circular).
 */
const { Movements, goals } = require('mineflayer-pathfinder');
const minecraftData = require('minecraft-data');
const { findPlayer } = require('./player-utils');

let botRef = null;
let activeTask = null;
let tickTimer = null;

function configureMovements(bot) {
    const mcData = minecraftData(bot.version);
    const movements = new Movements(bot, mcData);
    movements.canDig = true;
    movements.allow1by1towers = true;
    movements.allowParkour = true;
    movements.maxDropDown = 4;
    return movements;
}

function tick() {
    try {
        const bot = botRef;
        if (!bot?.entity || !activeTask) return;

        if (activeTask.type === 'follow') {
            const target = findPlayer(bot, activeTask.username);
            if (!target?.entity) return;
            bot.pathfinder.setMovements(configureMovements(bot));
            bot.pathfinder.setGoal(new goals.GoalFollow(target.entity, 2), true);
        }
    } catch (err) {
        console.error('[MC task]', err.message);
    }
}

function ensureLoop() {
    if (tickTimer) return;
    tickTimer = setInterval(tick, 800);
}

function initTaskManager(bot) {
    botRef = bot;
    ensureLoop();
}

function shutdownTaskManager() {
    activeTask = null;
    botRef = null;
    if (tickTimer) {
        clearInterval(tickTimer);
        tickTimer = null;
    }
}

function startFollow(username = null) {
    const bot = botRef;
    if (!bot?.entity) {
        throw new Error(
            'El bot de Minecraft no está en el mundo. Espera a que Pruebas aparezca en el servidor.'
        );
    }
    const target = findPlayer(bot, username);
    if (!target?.entity) {
        throw new Error(
            'No te veo en el servidor. Conéctate al mismo mundo que Pruebas y acércate (menos de 64 bloques).'
        );
    }
    activeTask = { type: 'follow', username: target.username };
    ensureLoop();
    tick();
    return target.username;
}

function stopAll() {
    activeTask = null;
    if (botRef) {
        try {
            botRef.pathfinder?.setGoal(null);
            botRef.stopDigging?.();
        } catch {
            /* ignore */
        }
        botRef.clearControlStates?.();
    }
}

function getActiveTask() {
    return activeTask;
}

module.exports = { startFollow, stopAll, getActiveTask, initTaskManager, shutdownTaskManager };
