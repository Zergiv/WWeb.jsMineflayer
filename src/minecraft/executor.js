const { matchIntents, wantsFollow } = require('./intents');
const { runAction } = require('./actions');
const { cancelAllActions } = require('./action-controller');
const { runGeneratedScript } = require('./script-runtime');
const { generateScript } = require('../services/script-generator');

/** No bloquean la cola de WhatsApp; se cancelan con cancelAllActions(). */
const LONG_RUNNING = new Set(['collect_wood', 'attack', 'attack_animals']);

const LONG_RUNNING_ACK = {
    collect_wood: 'Recolectando madera… (di "para" para parar)',
    attack: 'Atacando enemigos… (di "para" para parar)',
    attack_animals: 'Atacando animales… (di "para" para parar)',
};

async function runIntents(intents) {
    const messages = [];

    for (const intent of intents) {
        console.log('[MC intent]', intent.type, intent.params);

        if (LONG_RUNNING.has(intent.type)) {
            runAction(intent)
                .then((msg) => console.log('[MC bg]', intent.type, '→', msg))
                .catch((err) => console.error('[MC bg]', intent.type, err.message));
            messages.push(LONG_RUNNING_ACK[intent.type] || 'Trabajando…');
            continue;
        }

        messages.push(await runAction(intent));
    }

    return messages.join('\n');
}

/**
 * @param {string} userText
 * @returns {Promise<string>}
 */
async function executeVoiceCommand(userText) {
    cancelAllActions();

    const intents = matchIntents(userText);

    if (intents.length > 0) {
        return runIntents(intents);
    }

    const plan = await generateScript(userText);
    console.log('[MC llm]', JSON.stringify({ reply: plan.reply, codeLen: plan.code?.length || 0 }));

    const fallbackIntents = matchIntents(userText);
    if (fallbackIntents.length > 0) {
        return runIntents(fallbackIntents);
    }

    if (wantsFollow(userText) && (!plan.code || !/followPlayer|GoalFollow|setGoal/.test(plan.code))) {
        return runAction({ type: 'follow', params: {} });
    }

    if (!plan.code) {
        return plan.reply || 'No entendí la orden.';
    }

    try {
        await runGeneratedScript(plan.code);
        return plan.reply;
    } catch (err) {
        console.error('[MC script]', err);
        throw new Error(`${plan.reply}\nError: ${err.message}`);
    }
}

module.exports = { executeVoiceCommand };
