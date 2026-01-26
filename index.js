const { default: makeWASocket, useMultiFileAuthState, delay, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");

async function start() {
    // GANTI NAMA FOLDER KE 'session_final_banget'
    const { state, saveCreds } = await useMultiFileAuthState('session_final_banget');
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        browser: ["Chrome (Linux)", "Chrome", "110.0.0"],
        // Optimasi agar koneksi lebih kuat
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 30000
    });

    const nomorHP = "6285158738155";
    let sudahMinta = false;

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !sock.authState.creds.registered && !sudahMinta) {
            sudahMinta = true;
            console.log("\n🌐 Jaringan siap. Menunggu 40 detik agar stabil...");
            await delay(40000); // Beri waktu ekstra untuk Railway

            try {
                console.log("📨 Mengambil Kode Pairing untuk " + nomorHP);
                const code = await sock.requestPairingCode(nomorHP);
                console.log("\n========================================");
                console.log("🔥 KODE PAIRING ANDA: " + code);
                console.log("========================================\n");
            } catch (e) {
                console.log("❌ Gagal: " + e.message);
                sudahMinta = false;
            }
        }

        if (connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode;
            console.log(`⚠️ Putus (Status: ${reason}). Mengulang dalam 30 detik...`);
            if (reason !== DisconnectReason.loggedOut) {
                setTimeout(() => start(), 30000); 
            }
        } else if (connection === "open") {
            console.log("🎊 BOT TERHUBUNG!");
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

start();
