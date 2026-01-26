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
        printQRInTerminal: false, // Kita cetak manual agar rapi
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    const phoneNumber = "6285158738155";

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.clear();
            console.log("✅ QR CODE BERHASIL DIMUAT:");
            qrcode.generate(qr, { small: true });
            
            // Otomatis minta pairing code jika belum login
            if (!sock.authState.creds.registered) {
                try {
                    console.log("\n⏳ Sedang meminta Kode Pairing...");
                    await delay(3000);
                    const code = await sock.requestPairingCode(phoneNumber);
                    console.log("\n========================================");
                    console.log("🔥 KODE PAIRING ANDA: " + code);
                    console.log("========================================");
                    console.log("Cara Pakai: WA HP > Perangkat Tertaut > Tautkan dg No Telp");
                    console.log("========================================\n");
                } catch (e) {
                    console.log("Gagal minta kode, silakan scan QR saja.");
                }
            }
        }

        if (connection === "close") {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === "open") {
            console.log("\n🎊 BOT BERHASIL AKTIF!");
        }
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        console.log(`📩 Pesan: ${m.message.conversation || m.message.extendedTextMessage?.text}`);
    });
}

startBot();
