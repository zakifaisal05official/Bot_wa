const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { handleMessage } = require('./handler');

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './sessions' }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--no-zygote'
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null
    }
});

client.on('qr', (qr) => {
    console.log('📢 SCAN QR SEKARANG:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ BOT BERHASIL ONLINE DI RAILWAY!');
});

client.on('message_create', async (msg) => {
    if (msg.fromMe) return;
    try {
        await handleMessage(client, msg);
    } catch (e) {
        console.error('Error handler:', e);
    }
});

console.log('🚀 Sedang memulai mesin bot...');
client.initialize();
