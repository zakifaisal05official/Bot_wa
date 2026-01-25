const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { handleMessage } = require('./handler');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    }
});

let pairingCodeSent = false;

client.on('qr', async (qr) => {
    // 1. Tetap tampilkan QR di log sebagai cadangan
    console.log('\n--- QR CODE DETECTED ---');
    qrcode.generate(qr, { small: true });

    // 2. Minta Pairing Code HANYA SEKALI
    if (!pairingCodeSent) {
        const phoneNumber = "6285158738155"; 
        try {
            console.log(`\n📨 Meminta Kode Pairing untuk: ${phoneNumber}...`);
            const code = await client.requestPairingCode(phoneNumber);
            
            console.log("========================================");
            console.log("🔥 KODE PAIRING KAMU: " + code);
            console.log("========================================");
            console.log("👉 Masukkan kode ini di WhatsApp HP kamu");
            console.log("👉 Menu > Perangkat Tertaut > Tautkan dengan nomor");
            console.log("========================================\n");
            
            pairingCodeSent = true;
        } catch (err) {
            console.log("❌ Gagal meminta kode pairing, silakan scan QR di atas saja.");
            console.error(err);
        }
    }
});

client.on('ready', () => {
    console.log('🎊 BOT SUDAH AKTIF & TERHUBUNG!');
});

// Menangani pesan masuk
client.on('message', async (msg) => {
    try {
        await handleMessage(client, msg);
    } catch (e) {
        console.log("Error Handler:", e.message);
    }
});

// Penanganan jika auth gagal
client.on('auth_failure', () => {
    console.error('❌ Autentikasi gagal, mohon restart dan scan ulang.');
});

client.initialize();
