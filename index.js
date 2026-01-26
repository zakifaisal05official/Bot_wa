const { Client, LocalAuth } = require('whatsapp-web.js');
const { handleMessage } = require('./handler');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ]
    }
});

let pairingCodeRequested = false;

console.log("🚀 Memulai Bot - Mode Pairing Code...");

client.on('qr', async (qr) => {
    // Jika kode belum berhasil diminta, kita coba terus
    if (!pairingCodeRequested) {
        const phoneNumber = "6285158738155"; 
        
        const requestPairing = async () => {
            try {
                console.log("⏳ Sedang meminta kode pairing... (Tunggu 10-20 detik)");
                const code = await client.requestPairingCode(phoneNumber);
                
                console.log("\n========================================");
                console.log("🔥 KODE PAIRING ANDA: " + code);
                console.log("========================================");
                console.log("Masukkan di WA HP > Perangkat Tertaut");
                console.log("========================================\n");
                
                pairingCodeRequested = true;
            } catch (err) {
                console.log("⚠️ Gagal minta kode, mencoba lagi dalam 10 detik...");
                setTimeout(requestPairing, 10000); // Coba lagi tiap 10 detik
            }
        };

        requestPairing();
    }
});

client.on('ready', () => {
    console.log('🎊 BOT SUDAH AKTIF!');
});

client.on('message', async (msg) => {
    try { await handleMessage(client, msg); } catch (e) {}
});

client.initialize();
