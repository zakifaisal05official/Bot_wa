const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { handleMessage } = require('./handler');

// Inisialisasi Client
const client = new Client({
    authStrategy: new LocalAuth(), // Menyimpan login agar tidak scan terus
    puppeteer: {
        headless: true,
        handleSIGINT: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', 
            '--disable-gpu'
        ],
    }
});

console.log("🚀 Menghubungkan ke WhatsApp...");

// Munculkan QR Code di Logs
client.on('qr', (qr) => {
    console.clear();
    console.log('✅ QR CODE DITERIMA! SCAN SEKARANG:');
    qrcode.generate(qr, { small: true });
});

// Jika sudah berhasil Login
client.on('ready', () => {
    console.log('🎊 LOGIN BERHASIL! Bot sudah siap menerima pesan.');
});

// Tangani Pesan Masuk
client.on('message', async (msg) => {
    try {
        console.log(`📩 Pesan dari ${msg.from}: ${msg.body}`);
        // Kirim ke handler.js kamu
        await handleMessage(client, msg);
    } catch (e) {
        console.error("❌ Error saat memproses pesan:", e);
    }
});

// Tangani jika gagal login
client.on('auth_failure', msg => {
    console.error('❌ Gagal login, mencoba ulang...', msg);
});

client.initialize();
