const { execSync } = require('child_process');

const PM2 = 'npx pm2';

try {
    execSync(`${PM2} stop wwebj-bot`, { stdio: 'inherit', shell: true });
} catch {
    console.log('wwebj-bot no estaba en ejecución.');
}
