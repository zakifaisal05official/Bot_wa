const { default: makeWASocket, useMultiFileAuthState, delay, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");

async function start() {
    // GANTI LAGI NAMA FOLDER SESI (Wajib agar Railway buat storage baru)
    const { state, saveCreds } = await useMultiFileAuthState('sesi_total_reset');
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        // Optimasi Jaringan
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000,
        emitOwnEvents: true
    });

    const nomorHP = "6285158738155";
    let sedangMinta = false;

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !sock.authState.creds.registered && !sedangMinta) {
            sedangMinta = true;
            console.log("\n🌐 Jaringan siap. Menunggu 30 detik agar stabil...");
            await delay(30000); // Jeda lebih lama untuk Railway

            try {
                console.log("📨 Mengirim permintaan kode ke " + nomorHP);
                const code = await sock.requestPairingCode(nomorHP);
                console.log("\n========================================");
                console.log("🔥 KODE PAIRING ANDA: " + code);
                console.log("========================================\n");
            } catch (e) {
                console.log("❌ Gagal: " + e.message);
                sedangMinta = false;
            }
        }

        if (connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode;
            console.log(`⚠️ Terputus (Status: ${reason}). Mengulang dalam 20 detik...`);
            
            // Reconnect hanya jika bukan karena logout
            if (reason !== DisconnectReason.loggedOut) {
                setTimeout(() => start(), 20000); // Jeda 20 detik
            }
        } else if (connection === "open") {
            console.log("🎊 BOT TERHUBUNG!");
            sedangMinta = false;
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

start();
