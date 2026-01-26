const { default: makeWASocket, useMultiFileAuthState, delay, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");

async function start() {
    // Kita gunakan nama folder sesi yang baru untuk membuang sesi rusak yang lama
    const { state, saveCreds } = await useMultiFileAuthState('session_baru');
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    const nomorHP = "6285158738155";
    let sudahMintaKode = false;

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !sock.authState.creds.registered && !sudahMintaKode) {
            sudahMintaKode = true;
            console.log("\n----------------------------------------");
            console.log("⏳ Menunggu stabilitas koneksi (15 detik)...");
            await delay(15000); // Jeda lebih lama agar tidak looping disconnect

            try {
                console.log("📨 Meminta KODE PAIRING untuk: " + nomorHP);
                const code = await sock.requestPairingCode(nomorHP);
                console.log("\n========================================");
                console.log("🔥 KODE PAIRING ANDA: " + code);
                console.log("========================================");
            } catch (e) {
                console.log("❌ Gagal ambil kode, akan coba lagi nanti.");
                sudahMintaKode = false;
            }
        }

        if (connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode;
            // Hanya reconnect jika bukan karena logout atau alasan fatal
            if (reason !== DisconnectReason.loggedOut) {
                console.log("🔄 Koneksi terputus (Reason: " + reason + "), mencoba lagi...");
                // Tambahkan jeda agar tidak spamming reconnect
                setTimeout(() => start(), 5000);
            }
        } else if (connection === "open") {
            console.log("🎊 BOT BERHASIL TERHUBUNG!");
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

start();
