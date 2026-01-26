const { default: makeWASocket, useMultiFileAuthState, delay, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");

async function start() {
    // GUNAKAN NAMA BARU LAGI agar file sampah benar-benar terhapus
    const { state, saveCreds } = await useMultiFileAuthState('session_mac_baru');
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        // Ubah identitas ke macOS agar lebih dipercaya WhatsApp
        browser: ["Mac OS", "Chrome", "110.0.5481.177"]
    });

    const nomorHP = "6285158738155";
    let sudahMinta = false;

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !sock.authState.creds.registered && !sudahMinta) {
            sudahMinta = true;
            console.log("\n----------------------------------------");
            console.log("🌐 Menunggu Jaringan Stabil (10 detik)...");
            await delay(10000); 

            try {
                console.log("📨 Meminta Kode Pairing Baru...");
                const code = await sock.requestPairingCode(nomorHP);
                console.log("\n========================================");
                console.log("🔥 KODE PAIRING BARU ANDA: " + code);
                console.log("========================================");
            } catch (e) {
                console.log("Gagal: " + e.message);
                sudahMinta = false;
            }
        }

        if (connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                setTimeout(() => start(), 10000);
            }
        } else if (connection === "open") {
            console.log("🎊 BERHASIL TERHUBUNG!");
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

start();
