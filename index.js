const { default: makeWASocket, useMultiFileAuthState, delay, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const qrcode = require("qrcode-terminal");

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // Nomor kamu sudah diformat benar
    const nomorHP = "6285158738155";

    sock.ev.on("connection.update", async (update) => {
        const { qr, connection, lastDisconnect } = update;

        if (qr && !sock.authState.creds.registered) {
            console.clear();
            console.log("✅ QR MUNCUL (Jika ingin scan):");
            qrcode.generate(qr, { small: true });

            console.log("\n⏳ Menunggu 7 detik untuk mengambil KODE PAIRING...");
            await delay(7000);
            try {
                const code = await sock.requestPairingCode(nomorHP);
                console.log("\n========================================");
                console.log("🔥 KODE PAIRING ANDA: " + code);
                console.log("========================================");
                console.log("Buka WA > Perangkat Tertaut > Tautkan dg No Telp");
                console.log("========================================\n");
            } catch (e) {
                console.log("Gagal ambil kode, silakan coba restart service.");
            }
        }

        if (connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) start();
        } else if (connection === "open") {
            console.log("🎊 BOT SUDAH TERHUBUNG!");
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

start();
