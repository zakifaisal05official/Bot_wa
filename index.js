const { Client, LocalAuth } = require('whatsapp-web.js');
const { handleMessage } = require('./handler');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    }
});

let codeSent = false;

console.log("🚀 Memulai Bot - Mode Pairing Code (Tanpa Scan)...");

client.on('qr', async (qr) => {
    // Kita abaikan QR karena berantakan di layar HP kamu
    if (!codeSent) {
        const phoneNumber = "6285158738155"; // Nomor kamu
        try {
            console.log("\n----------------------------------------");
            console.log("⏳ Sedang meminta kode pairing...");
            const code = await client.requestPairingCode(phoneNumber);
            console.log("🔥 KODE PAIRING ANDA: " + code);
            console.log("----------------------------------------");
            console.log("CARA PAKAI:");
            console.log("1. Buka WA di HP kamu.");
            console.log("2. Perangkat Tertaut > Tautkan Perangkat.");
            console.log("3. Pilih 'Tautkan dengan nomor telepon saja' di bawah.");
            console.log("4. Masukkan kode: " + code);
            console.log("----------------------------------------\n");
            codeSent = true;
        } catch (err) {
            console.log("⚠️ Gagal minta kode, tunggu sebentar...");
        }
    }
});

client.on('ready', () => {
    console.log('🎊 BERHASIL TERHUBUNG!');
});

client.on('message', async (msg) => {
    try { await handleMessage(client, msg); } catch (e) {}
});

client.initialize();
