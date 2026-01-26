const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    DisconnectReason 
} = require("@whiskeysockets/baileys");
const pino = require("pino");

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        browser: ["Linux", "Chrome", "110.0.0"]
    });

    const phoneNumber = "6285158738155";

    if (!sock.authState.creds.registered) {
        console.log("⏳ Menghubungkan ke WhatsApp...");
        await delay(5000); 

        try {
            const code = await sock.requestPairingCode(phoneNumber);
            console.log("\n========================================");
            console.log("🔥 KODE PAIRING ANDA: " + code);
            console.log("========================================");
            console.log("Input di WA HP > Perangkat Tertaut > Tautkan dg No Telp");
            console.log("========================================\n");
        } catch (err) {
            console.log("❌ Gagal. Coba RESTART/REDEPLOY di Railway.");
        }
    }

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === "open") {
            console.log("🎊 BOT BERHASIL AKTIF!");
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

connectToWhatsApp();
