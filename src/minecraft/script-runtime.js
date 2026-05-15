const vm = require('vm');
const { Vec3 } = require('vec3');
const minecraftData = require('minecraft-data');
const { Movements, goals } = require('mineflayer-pathfinder');
const { isReady, getBot } = require('./bot');
const { runAction } = require('./actions');

const SCRIPT_TIMEOUT_MS = 60000;

function sanitizeGeneratedCode(code) {
    let c = String(code || '').trim();
    const fence = c.match(/^```(?:javascript|js)?\s*([\s\S]*?)```$/i);
    if (fence) c = fence[1].trim();
    const iife = c.match(/^\(async\s*\(\)\s*=>\s*\{([\s\S]*)\}\)\s*\(\)\s*;?$/);
    if (iife) c = iife[1].trim();
    c = c.replace(/\bbot\.attackEntity\b/g, 'attackEntity');
    return c;
}

function buildSandbox(bot) {
    const mcData = minecraftData(bot.version);

    const movements = () => {
        const m = new Movements(bot, mcData);
        m.canDig = true;
        m.allow1by1towers = true;
        m.allowParkour = true;
        return m;
    };

    return {
        bot,
        goals,
        Movements,
        Vec3,
        console,

        blockId(name) {
            const b = mcData.blocksByName[name];
            if (!b) throw new Error(`Bloque desconocido: ${name}`);
            return b.id;
        },

        nearestPlayer(maxDist = 64) {
            let best = null;
            let bestD = maxDist;
            for (const p of Object.values(bot.players)) {
                if (!p?.entity || p.username === bot.username) continue;
                const d = bot.entity.position.distanceTo(p.entity.position);
                if (d < bestD) {
                    bestD = d;
                    best = p;
                }
            }
            return best;
        },

        followPlayer() {
            const player =
                Object.values(bot.players).find(
                    (p) => p?.entity && p.username !== bot.username
                ) || null;
            if (!player?.entity) throw new Error('No hay jugador cerca');
            bot.pathfinder.setMovements(movements());
            bot.pathfinder.setGoal(new goals.GoalFollow(player.entity, 2), true);
            return player.username;
        },

        stopMoving() {
            bot.pathfinder.setGoal(null);
            bot.clearControlStates();
        },

        async gotoNear(x, y, z, range = 2) {
            bot.pathfinder.setMovements(movements());
            await bot.pathfinder.goto(new goals.GoalNear(x, y, z, range));
        },

        async digBlockAt(x, y, z) {
            const block = bot.blockAt(new Vec3(x, y, z));
            if (!block) throw new Error('No hay bloque ahí');
            await bot.dig(block);
        },

        findBlocksByNames(names, maxDistance = 48, count = 10) {
            const ids = names
                .map((n) => mcData.blocksByName[n]?.id)
                .filter((id) => id != null);
            return bot.findBlocks({ matching: ids, maxDistance, count });
        },

        /** Mineflayer usa bot.attack(entity), no bot.attackEntity */
        attackEntity(entity) {
            if (!entity?.position) throw new Error('Entidad inválida');
            return bot.attack(entity);
        },

        attackAnimals(max = 8) {
            return runAction({ type: 'attack_animals', params: { max } });
        },
    };
}

async function runGeneratedScript(code) {
    if (!isReady()) {
        throw new Error('El bot de Minecraft no está conectado');
    }
    if (!code) return {};

    const bot = getBot();
    const sandbox = {
        Promise,
        setTimeout,
        clearTimeout,
        ...buildSandbox(bot),
    };

    const body = sanitizeGeneratedCode(code);
    const wrapped = `(async () => {\n${body}\n})();`;
    const script = new vm.Script(wrapped, { filename: 'mineflayer-dynamic.js' });
    const outcome = script.runInNewContext(sandbox, {
        timeout: SCRIPT_TIMEOUT_MS,
        displayErrors: true,
    });

    if (outcome && typeof outcome.then === 'function') {
        await outcome;
    }

    return {};
}

module.exports = { runGeneratedScript };
