const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const config = require('./src/config');
const { isAllowedMessage, logSkipped } = require('./src/auth/whitelist');
const { handleCommand } = require('./src/handlers/commands');
const { handleVoice } = require('./src/handlers/voice');
const { connect } = require('./src/minecraft/bot');
const { safeReply } = require('./src/utils/wa-reply');

const client = new Client({
    authStrategy: new LocalAuth(),
});

client.on('qr', (qr) => {
    console.log('Escanea el QR con WhatsApp (Dispositivos vinculados):');
    qrcode.generate(qr, { small: true });
});

client.once('ready', () => {
    console.log('Cliente WhatsApp listo.');
    console.log(`Solo responde a: +${config.allowedPhone} (chat privado)`);
    console.log('Envía !ping desde el móvil (chat contigo o con este número).');
    console.log('Comandos: !ping | !mineflayer | !estado');
    connect();
});

client.on('auth_failure', (msg) => {
    console.error('Error de autenticación:', msg);
});

client.on('disconnected', (reason) => {
    console.warn('Cliente desconectado:', reason);
});

client.on('message_create', async (message) => {
    try {
        const allowed = await isAllowedMessage(message);
        if (!allowed) {
            if (!message.fromMe || message.body?.startsWith('!')) {
                logSkipped(message);
            }
            return;
        }

        console.log('[WA]', message.fromMe ? 'tú' : 'entrante', message.type, message.body?.slice(0, 60) || '(media)');

        if (await handleCommand(message)) return;
        if (await handleVoice(message)) return;
    } catch (err) {
        console.error('Error procesando mensaje:', err);
        try {
            if (await isAllowedMessage(message)) {
                await safeReply(message, `Error interno: ${err.message}`);
            }
        } catch {
            /* ignore */
        }
    }
});

client.initialize();
