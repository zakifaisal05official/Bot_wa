const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    DisconnectReason 
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const qrcode = require("qrcode-terminal");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session_data');
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false, // Kita atur manual agar lebih rapi
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    const phoneNumber = "6285158738155";

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // Tampilkan QR Code jika ada
        if (qr) {
            console.clear();
            console.log("✅ QR CODE DITERIMA! SCAN SEKARANG:");
            qrcode.generate(qr, { small: true });
            
            // Minta Pairing Code otomatis sebagai cadangan
            if (!sock.authState.creds.registered) {
                try {
                    console.log("\n⏳ Meminta Kode Pairing...");
                    await delay(3000);
                    const code = await sock.requestPairingCode(phoneNumber);
                    console.log("========================================");
                    console.log("🔥 KODE PAIRING ANDA: " + code);
                    console.log("========================================");
                } catch (e) {
                    console.log("Gagal minta kode pairing, fokus scan QR saja.");
                }
            }
        }

        if (connection === "close") {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === "open") {
            console.log("\n🎊 BOT BERHASIL AKTIF & TERHUBUNG!");
        }
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        console.log(`📩 Pesan Masuk: ${m.message.conversation || m.message.extendedTextMessage?.text}`);
    });
}

startBot();
