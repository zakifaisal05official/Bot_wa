const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { handleMessage } = require('./handler');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', async (qr) => {
    // Menampilkan QR sebagai cadangan
    console.log('--- QR CODE (Scan jika mau) ---');
    qrcode.generate(qr, { small: true });
    
    // Memicu PAIRING CODE
    // GANTI nomor di bawah dengan nomor HP kamu (awali 62)
    const phoneNumber = "6285158738155"; 
    try {
        const code = await client.requestPairingCode(phoneNumber);
        console.log("========================================");
        console.log("🔥 KODE PAIRING KAMU: " + code);
        console.log("========================================");
        console.log("Cara Pakai:");
        console.log("1. Buka WA di HP > Perangkat Tertaut");
        console.log("2. Pilih 'Tautkan Perangkat'");
        console.log("3. Pilih 'Tautkan dengan nomor telepon saja' di bagian bawah");
        console.log("4. Masukkan kode di atas!");
    } catch (err) {
        console.log("Gagal meminta kode pairing, silakan scan QR saja.");
    }
});

client.on('ready', () => {
    console.log('🎊 BOT SUDAH AKTIF!');
});

client.on('message', async (msg) => {
    await handleMessage(client, msg);
});

client.initialize();
