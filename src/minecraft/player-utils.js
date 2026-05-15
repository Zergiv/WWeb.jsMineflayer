/** Encuentra el jugador humano más cercano (entidades + tab list). */
function findNearestPlayer(bot, maxDist = 64) {
    let best = null;
    let bestD = maxDist;

    for (const entity of Object.values(bot.entities)) {
        if (entity.type !== 'player' || entity.username === bot.username) continue;
        const d = bot.entity.position.distanceTo(entity.position);
        if (d < bestD) {
            bestD = d;
            best = { username: entity.username, entity };
        }
    }

    if (best) return best;

    for (const p of Object.values(bot.players)) {
        if (!p?.entity || p.username === bot.username) continue;
        const d = bot.entity.position.distanceTo(p.entity.position);
        if (d < bestD) {
            bestD = d;
            best = { username: p.username, entity: p.entity };
        }
    }

    return best;
}

function findPlayer(bot, username, maxDist = 64) {
    if (username) {
        const p = bot.players[username];
        if (p?.entity) return { username, entity: p.entity };
        const e = Object.values(bot.entities).find(
            (x) => x.type === 'player' && x.username === username
        );
        if (e) return { username, entity: e };
        return null;
    }
    return findNearestPlayer(bot, maxDist);
}

module.exports = { findNearestPlayer, findPlayer };
