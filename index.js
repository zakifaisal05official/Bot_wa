const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    DisconnectReason 
} = require("@whiskeysockets/baileys");
const pino = require("pino");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session_data');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true, // Tetap cetak QR jika ingin scan
        logger: pino({ level: "silent" }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // --- LOGIKA PAIRING CODE ---
    const phoneNumber = "6285158738155";
    if (!sock.authState.creds.registered) {
        console.log(`\n⏳ Sedang meminta kode pairing untuk: ${phoneNumber}...`);
        await delay(5000); // Tunggu sebentar agar koneksi siap
        try {
            const code = await sock.requestPairingCode(phoneNumber);
            console.log("\n========================================");
            console.log("🔥 KODE PAIRING ANDA: " + code);
            console.log("========================================");
            console.log("Input di WA HP > Perangkat Tertaut");
            console.log("========================================\n");
        } catch (err) {
            console.log("❌ Gagal meminta kode pairing: ", err.message);
        }
    }

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("Koneksi terputus, mencoba hubungkan ulang...", shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === "open") {
            console.log("🎊 BOT BERHASIL AKTIF!");
        }
    });

    sock.ev.on("creds.update", saveCreds);

    // Handler pesan (sesuaikan dengan handler.js kamu)
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        console.log(`📩 Pesan dari ${msg.key.remoteJid}: ${msg.message.conversation || msg.message.extendedTextMessage?.text}`);
        
        // Catatan: Kamu perlu menyesuaikan handler.js kamu agar cocok dengan format Baileys
    });
}

startBot();
