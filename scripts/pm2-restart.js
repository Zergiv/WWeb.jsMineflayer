/**
 * Reinicio seguro: borra procesos viejos (p. ej. wwebj-whisper) y arranca de nuevo.
 */
const { execSync } = require('child_process');

const PM2 = 'npx pm2';

function run(cmd, ignoreError = false) {
    try {
        execSync(cmd, {
            stdio: 'inherit',
            shell: true,
            cwd: require('path').join(__dirname, '..'),
            windowsHide: true,
        });
    } catch (err) {
        if (!ignoreError) throw err;
    }
}

run(`${PM2} delete wwebj-bot`, true);
run(`${PM2} delete wwebj-whisper 2>nul`, true);
run(`${PM2} start ecosystem.config.cjs`);
console.log('\nListo. Ver estado: npm run pm2:status | Ver logs: npm run pm2:logs');
