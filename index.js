const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { handleMessage } = require('./handler');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        handleSIGINT: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ],
    }
});

let pairingCodeRequested = false;

console.log("🚀 Menghubungkan ke WhatsApp...");

client.on('qr', async (qr) => {
    console.clear();
    console.log('✅ QR CODE DITERIMA!');
    
    // 1. Menampilkan QR dengan mode 'small' agar lebih rapat di layar HP
    qrcode.generate(qr, { small: true });

    console.log('\n💡 TIPS SCAN:');
    console.log('- Zoom Out browser Railway kamu sampai QR berbentuk kotak sempurna.');
    console.log('- Jika sulit di-scan, gunakan KODE PAIRING di bawah ini:\n');

    // 2. OTOMATIS memunculkan Pairing Code jika QR muncul
    if (!pairingCodeRequested) {
        const phoneNumber = "6285158738155"; // Nomor kamu sudah saya masukkan
        try {
            const code = await client.requestPairingCode(phoneNumber);
            console.log("========================================");
            console.log("🔥 KODE PAIRING: " + code);
            console.log("========================================");
            console.log("Cara Input: WA HP > Perangkat Tertaut > Tautkan dg Nomor");
            pairingCodeRequested = true;
        } catch (err) {
            console.log("Gagal memicu kode pairing, fokus scan QR saja.");
        }
    }
});

client.on('ready', () => {
    console.log('🎊 LOGIN BERHASIL! Bot sudah aktif.');
});

client.on('message', async (msg) => {
    try {
        await handleMessage(client, msg);
    } catch (e) {
        console.error("❌ Error Handler:", e);
    }
});

client.on('auth_failure', () => {
    console.error('❌ Gagal login, pastikan nomor benar dan belum tertaut di 4 perangkat.');
});

client.initialize();
