const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys");
const pino = require("pino");

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    const nomorHP = "6285158738155";

    if (!sock.authState.creds.registered) {
        console.log("⏳ Sedang menyalakan mesin pairing...");
        await delay(5000); // Tunggu koneksi stabil
        try {
            const code = await sock.requestPairingCode(nomorHP);
            console.log("\n========================================");
            console.log("🔥 KODE PAIRING ANDA: " + code);
            console.log("========================================");
        } catch (e) {
            console.log("Gagal ambil kode, mencoba ulang...");
        }
    }

    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("connection.update", (up) => {
        if (up.connection === "open") console.log("🎊 BOT AKTIF!");
    });
}
start();
