const { getBot } = require('./bot');
const { stopAll: stopFollowTask } = require('./task-manager');

let abortGeneration = 0;

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

function interruptMovement(bot) {
    if (!bot) return;
    try {
        bot.pathfinder?.setGoal(null);
        bot.stopDigging?.();
    } catch {
        /* ignore */
    }
    bot.clearControlStates?.();
}

/** Cancela tareas largas (recolectar, atacar) y pathfinder. */
function cancelAllActions() {
    abortGeneration += 1;
    stopFollowTask();
    interruptMovement(getBot());
    return abortGeneration;
}

function beginAction() {
    return abortGeneration;
}

function isActionCancelled(token) {
    return token !== abortGeneration;
}

/**
 * pathfinder.goto no se interrumpe solo con setGoal(null); hay que vigilar cancelación.
 */
async function cancellableGoto(bot, goal, token) {
    if (isActionCancelled(token)) return false;

    let pollTimer;
    const cancelled = new Promise((resolve) => {
        pollTimer = setInterval(() => {
            if (isActionCancelled(token)) {
                clearInterval(pollTimer);
                interruptMovement(bot);
                resolve(false);
            }
        }, 150);
    });

    const moved = bot.pathfinder.goto(goal).then(
        () => true,
        () => false
    );

    const ok = await Promise.race([moved, cancelled]);
    clearInterval(pollTimer);
    if (!ok && isActionCancelled(token)) {
        interruptMovement(bot);
    }
    return ok && !isActionCancelled(token);
}

async function cancellableDig(bot, block, token) {
    if (isActionCancelled(token)) return false;

    const digPromise = bot.dig(block);
    while (!isActionCancelled(token)) {
        const state = await Promise.race([
            digPromise.then(() => 'done').catch(() => 'fail'),
            sleep(150).then(() => 'tick'),
        ]);
        if (state === 'done') return true;
        if (state === 'fail') return false;
    }
    bot.stopDigging?.();
    return false;
}

module.exports = {
    cancelAllActions,
    beginAction,
    isActionCancelled,
    cancellableGoto,
    cancellableDig,
    interruptMovement,
};
