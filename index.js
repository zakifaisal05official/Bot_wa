const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys");
const pino = require("pino");
const qrcode = require("qrcode-terminal");

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        browser: ["Chrome (Linux)", "Chrome", "1.0.0"]
    });

    const nomorHP = "6285158738155";

    sock.ev.on("connection.update", async (update) => {
        const { qr, connection } = update;

        if (qr) {
            console.clear();
            console.log("✅ QR MUNCUL (Bisa di-scan):");
            qrcode.generate(qr, { small: true });

            if (!sock.authState.creds.registered) {
                console.log("\n⏳ Menyiapkan KODE PAIRING...");
                await delay(5000);
                try {
                    const code = await sock.requestPairingCode(nomorHP);
                    console.log("\n========================================");
                    console.log("🔥 KODE PAIRING ANDA: " + code);
                    console.log("========================================");
                } catch (e) {
                    console.log("Gagal ambil kode, silakan scan QR saja.");
                }
            }
        }
        
        if (connection === "open") console.log("🎊 TERHUBUNG!");
    });

    sock.ev.on("creds.update", saveCreds);
}

start();
