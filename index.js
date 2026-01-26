const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys");
const pino = require("pino");
const qrcode = require("qrcode-terminal");

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    const nomorHP = "6285158738155";

    sock.ev.on("connection.update", async (update) => {
        const { qr, connection } = update;

        if (qr && !sock.authState.creds.registered) {
            console.clear();
            console.log("✅ QR MUNCUL:");
            qrcode.generate(qr, { small: true });

            const mintaKode = async () => {
                try {
                    console.log("\n⏳ Sedang meminta KODE PAIRING...");
                    await delay(7000);
                    const code = await sock.requestPairingCode(nomorHP);
                    console.log("\n========================================");
                    console.log("🔥 KODE PAIRING ANDA: " + code);
                    console.log("========================================");
                } catch (e) {
                    console.log("Gagal ambil kode, mencoba lagi...");
                    setTimeout(mintaKode, 10000);
                }
            };
            mintaKode();
        }
        
        if (connection === "open") console.log("🎊 TERHUBUNG!");
    });

    sock.ev.on("creds.update", saveCreds);
}
start();
