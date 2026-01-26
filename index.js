const { Client, LocalAuth } = require('whatsapp-web.js');
const { handleMessage } = require('./handler');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        // Tambahkan flag untuk performa rendah
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-zygote',
            '--single-process'
        ],
    }
});

let pairingCodeRequested = false;

console.log("🚀 Menjalankan Mesin Bot...");

client.on('qr', async (qr) => {
    if (!pairingCodeRequested) {
        pairingCodeRequested = true;
        const phoneNumber = "6285158738155";
        
        console.log("⏳ Halaman WA terbuka. Menunggu 45 detik agar sinkron...");
        
        // Jeda lebih lama (45 detik) agar Railway sempat render halaman
        setTimeout(async () => {
            try {
                console.log(`📨 Mengirim permintaan kode pairing ke ${phoneNumber}...`);
                const code = await client.requestPairingCode(phoneNumber);
                console.log("\n========================================");
                console.log("🔥 KODE PAIRING ANDA: " + code);
                console.log("========================================");
            } catch (err) {
                console.log("❌ Gagal lagi. Penyebab: Server Railway terlalu lambat.");
                pairingCodeRequested = false; 
            }
        }, 45000); 
    }
});

client.on('ready', () => {
    console.log('🎊 BOT BERHASIL AKTIF!');
});

client.on('message', async (msg) => {
    try { await handleMessage(client, msg); } catch (e) {}
});

client.initialize();
