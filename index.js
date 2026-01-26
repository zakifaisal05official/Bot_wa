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
        printQRInTerminal: false,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    const phoneNumber = "6285158738155";

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.clear();
            console.log("✅ QR CODE BERHASIL DIMUAT:");
            qrcode.generate(qr, { small: true });
            
            if (!sock.authState.creds.registered) {
                try {
                    console.log("\n⏳ Sedang meminta Kode Pairing...");
                    await delay(5000); 
                    const code = await sock.requestPairingCode(phoneNumber);
                    console.log("\n========================================");
                    console.log("🔥 KODE PAIRING ANDA: " + code);
                    console.log("========================================");
                    console.log("Input di WA HP > Perangkat Tertaut > Tautkan dg No Telp");
                    console.log("========================================\n");
                } catch (e) {
                    console.log("Gagal minta kode, coba biarkan QR muncul.");
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
}

startBot();
