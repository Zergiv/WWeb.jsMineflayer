const minecraftData = require('minecraft-data');
const { Movements, goals } = require('mineflayer-pathfinder');
const { getBot, isReady } = require('./bot');
const { findNearestPlayer } = require('./player-utils');
const { startFollow, stopAll } = require('./task-manager');
const {
    beginAction,
    isActionCancelled,
    cancellableGoto,
    cancellableDig,
} = require('./action-controller');

const LOG_BLOCKS = [
    'oak_log',
    'birch_log',
    'spruce_log',
    'jungle_log',
    'acacia_log',
    'dark_oak_log',
    'mangrove_log',
    'cherry_log',
];

const HOSTILE_MOBS = new Set([
    'zombie',
    'husk',
    'drowned',
    'skeleton',
    'creeper',
    'spider',
    'cave_spider',
    'witch',
    'phantom',
]);

const ANIMAL_MOBS = new Set([
    'pig',
    'cow',
    'sheep',
    'chicken',
    'rabbit',
    'mooshroom',
    'horse',
    'donkey',
    'mule',
    'llama',
    'trader_llama',
    'goat',
    'axolotl',
    'frog',
    'camel',
]);

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

function getMcData(bot) {
    return minecraftData(bot.version);
}

function configureMovements(bot) {
    const mcData = getMcData(bot);
    const movements = new Movements(bot, mcData);
    movements.canDig = true;
    movements.allow1by1towers = true;
    movements.allowParkour = true;
    movements.maxDropDown = 4;
    return movements;
}

async function follow() {
    const name = startFollow();
    return `Te sigo, ${name}. (dime "para" para detenerme)`;
}

async function comeToPlayer() {
    const token = beginAction();
    const bot = getBot();
    const player = findNearestPlayer(bot);
    if (!player) {
        throw new Error('No veo jugadores cerca en el servidor.');
    }
    bot.pathfinder.setMovements(configureMovements(bot));
    const pos = player.entity.position;
    await bot.pathfinder.goto(new goals.GoalNear(pos.x, pos.y, pos.z, 2));
    if (isActionCancelled(token)) return 'Cancelado.';
    return `Llegué cerca de ${player.username}.`;
}

function stop() {
    stopAll();
    return 'Detenido.';
}

function findNearestMob(bot, { allowedNames, species, maxDist = 32 }) {
    return Object.values(bot.entities)
        .filter((e) => e?.position && e.type === 'mob')
        .filter((e) => bot.entity.position.distanceTo(e.position) < maxDist)
        .filter((e) => allowedNames.has(e.name))
        .filter((e) => !species || e.name === species)
        .sort(
            (a, b) =>
                bot.entity.position.distanceTo(a.position) -
                bot.entity.position.distanceTo(b.position)
        )[0];
}

async function attackMobs({ allowedNames, species = null, max = 8, emptyMsg, doneLabel }) {
    const token = beginAction();
    const bot = getBot();
    bot.pathfinder.setMovements(configureMovements(bot));
    let killed = 0;
    const deadline = Date.now() + 90_000;

    while (killed < max && Date.now() < deadline) {
        if (isActionCancelled(token)) {
            return `Detenido. ${doneLabel} ${killed} antes de parar.`;
        }

        const target = findNearestMob(bot, { allowedNames, species });
        if (!target) break;

        const p = target.position;
        try {
            const reached = await cancellableGoto(
                bot,
                new goals.GoalNear(p.x, p.y, p.z, 2),
                token
            );
            if (!reached || isActionCancelled(token)) break;
            await bot.attack(target);
            killed++;
            await sleep(600);
        } catch {
            await sleep(400);
        }
    }

    return killed === 0 ? emptyMsg : `${doneLabel} ${killed}.`;
}

async function attackHostiles({ hostile = 'any', max = 8 }) {
    const species = hostile === 'any' ? null : hostile;
    return attackMobs({
        allowedNames: HOSTILE_MOBS,
        species,
        max,
        emptyMsg: 'No hay enemigos cerca.',
        doneLabel: 'Eliminé',
    });
}

async function attackAnimals({ species = null, max = 8 }) {
    return attackMobs({
        allowedNames: ANIMAL_MOBS,
        species,
        max,
        emptyMsg: 'No veo animales cerca.',
        doneLabel: 'Ataqué',
    });
}

function countLogsInInventory(bot, mcData, blockName) {
    const names = blockName ? [blockName] : LOG_BLOCKS;
    const ids = new Set(names.map((n) => mcData.blocksByName[n]?.id).filter((id) => id != null));
    let total = 0;
    for (const item of Object.values(bot.inventory.items())) {
        if (ids.has(item.type)) total += item.count;
    }
    return total;
}

async function collectWood({ block = null, quantity = 16 }) {
    const token = beginAction();
    const bot = getBot();
    const mcData = getMcData(bot);
    const logNames = block ? [block] : LOG_BLOCKS;
    const matching = logNames.map((n) => mcData.blocksByName[n]?.id).filter((id) => id != null);

    if (matching.length === 0) {
        throw new Error(`Tipo de madera desconocido: ${block}`);
    }

    bot.pathfinder.setMovements(configureMovements(bot));
    const startCount = countLogsInInventory(bot, mcData, block);
    const deadline = Date.now() + 120_000;

    while (countLogsInInventory(bot, mcData, block) - startCount < quantity && Date.now() < deadline) {
        if (isActionCancelled(token)) {
            const gathered = countLogsInInventory(bot, mcData, block) - startCount;
            return `Recolecta cancelada (${gathered} troncos).`;
        }

        const positions = bot.findBlocks({ matching, maxDistance: 48, count: 5 });
        if (!positions.length) {
            throw new Error('No encuentro árboles cerca.');
        }

        const pos = positions[0];
        try {
            const reached = await cancellableGoto(
                bot,
                new goals.GoalNear(pos.x, pos.y, pos.z, 1),
                token
            );
            if (!reached || isActionCancelled(token)) {
                const gathered = countLogsInInventory(bot, mcData, block) - startCount;
                return `Recolecta cancelada (${gathered} troncos).`;
            }
            const target = bot.blockAt(pos);
            if (target && matching.includes(target.type)) {
                await cancellableDig(bot, target, token);
            }
        } catch {
            if (isActionCancelled(token)) {
                const gathered = countLogsInInventory(bot, mcData, block) - startCount;
                return `Recolecta cancelada (${gathered} troncos).`;
            }
            await sleep(500);
        }
    }

    const gathered = countLogsInInventory(bot, mcData, block) - startCount;
    return `Recolecté ${gathered} tronco(s).`;
}

async function runAction(intent) {
    if (!isReady()) {
        throw new Error('El bot de Minecraft no está conectado al servidor.');
    }

    switch (intent.type) {
        case 'follow':
            return await follow();
        case 'come':
            return await comeToPlayer();
        case 'stop':
            return stop();
        case 'attack':
            return await attackHostiles(intent.params);
        case 'attack_animals':
            return await attackAnimals(intent.params);
        case 'collect_wood':
            return await collectWood(intent.params);
        default:
            throw new Error(`Acción desconocida: ${intent.type}`);
    }
}

module.exports = { runAction };
