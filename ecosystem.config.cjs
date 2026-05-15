const path = require('path');

const root = __dirname;

/** No pasar process.env a PM2: rompe en Node 24 (JSON "undefined"). El bot carga .env en src/config.js */
module.exports = {
    apps: [
        {
            name: 'wwebj-bot',
            script: 'main.js',
            cwd: root,
            exec_mode: 'fork',
            instances: 1,
            autorestart: true,
            max_restarts: 10,
            min_uptime: 5000,
            restart_delay: 5000,
            watch: false,
            max_memory_restart: '2G',
            error_file: path.join(root, 'logs', 'bot-error.log'),
            out_file: path.join(root, 'logs', 'bot-out.log'),
            merge_logs: true,
            time: true,
        },
    ],
};
