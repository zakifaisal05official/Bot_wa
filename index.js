const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    DisconnectReason 
} = require("@whiskeysockets/baileys");
const pino = require("pino");

async function startBot() {
    // Menyimpan sesi di folder 'auth_info'
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: "silent" }),
        browser: ["Chrome (Linux)", "Chrome", "110.0.0"]
    });

    // NOMOR HP KAMU
    const phoneNumber = "6285158738155";

    // MINTA KODE PAIRING JIKA BELUM LOGIN
    if (!sock.authState.creds.registered) {
        console.log(`\n⏳ Menghubungkan ke server WhatsApp...`);
        await delay(6000); // Tunggu 6 detik agar koneksi stabil
        
        try {
            console.log(`📨 Meminta kode pairing untuk: ${phoneNumber}`);
            const code = await sock.requestPairingCode(phoneNumber);
            console.log("\n========================================");
            console.log("🔥 KODE PAIRING ANDA: " + code);
            console.log("========================================");
            console.log("Masukkan di WA HP > Perangkat Tertaut");
            console.log("========================================\n");
        } catch (err) {
            console.log("❌ Gagal minta kode. Coba klik 'Redeploy' di Railway.");
        }
    }

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === "open") {
            console.log("🎊 BOT BERHASIL AKTIF!");
        }
    });

    sock.ev.on("creds.update", saveCreds);

    // Baca Pesan
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        const text = m.message.conversation || m.message.extendedTextMessage?.text;
        console.log(`📩 Pesan: ${text}`);
    });
}

startBot();
