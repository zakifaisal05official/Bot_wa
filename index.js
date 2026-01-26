const { Client, LocalAuth } = require('whatsapp-web.js');
const { handleMessage } = require('./handler');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process'
        ]
    }
});

let pairingCodeRequested = false;

console.log("🚀 Menghubungkan... (Tunggu sekitar 1 menit)");

client.on('qr', async (qr) => {
    if (!pairingCodeRequested) {
        pairingCodeRequested = true; 
        const phoneNumber = "6285158738155"; 
        
        // Kasih jeda 30 detik agar halaman WA beneran kebuka sempurna
        console.log("⏳ Menunggu WhatsApp Web stabil...");
        
        setTimeout(async () => {
            try {
                console.log(`📨 Meminta kode pairing untuk ${phoneNumber}...`);
                const code = await client.requestPairingCode(phoneNumber);
                console.log("\n========================================");
                console.log("🔥 KODE PAIRING ANDA: " + code);
                console.log("========================================");
            } catch (err) {
                console.log("❌ Gagal. Coba RESTART Service di Railway.");
                pairingCodeRequested = false; // Reset agar bisa coba lagi
            }
        }, 30000); 
    }
});

client.on('ready', () => {
    console.log('🎊 BOT BERHASIL AKTIF!');
});

client.on('message', async (msg) => {
    try { await handleMessage(client, msg); } catch (e) {}
});

client.initialize();
