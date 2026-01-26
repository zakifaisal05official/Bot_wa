const { default: makeWASocket, useMultiFileAuthState, delay, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");

async function start() {
    // Gunakan nama folder sesi yang benar-benar baru untuk membuang error lama
    const { state, saveCreds } = await useMultiFileAuthState('session_final_fix');
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false, // QR Matikan agar fokus ke kode
        // Browser ini sangat penting agar notif masuk ke HP
        browser: ["Ubuntu", "Chrome", "110.0.5481.177"]
    });

    // Format nomor harus string tanpa spasi/simbol
    const nomorHP = "6285158738155";
    let sudahMinta = false;

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !sock.authState.creds.registered && !sudahMinta) {
            sudahMinta = true;
            
            console.log("\n----------------------------------------");
            console.log("🌐 MENUNGGU JARINGAN STABIL (15 DETIK)...");
            console.log("----------------------------------------");
            
            await delay(15000); 

            try {
                console.log("📨 MEMINTA KODE PAIRING UNTUK: " + nomorHP);
                const code = await sock.requestPairingCode(nomorHP);
                console.log("\n========================================");
                console.log("🔥 KODE PAIRING ANDA: " + code);
                console.log("========================================");
                console.log("CEK NOTIFIKASI DI WA HP SEKARANG!");
                console.log("Atau buka: Perangkat Tertaut > Tautkan dg No Telp");
                console.log("========================================\n");
            } catch (e) {
                console.log("❌ Gagal meminta kode: ", e.message);
                sudahMinta = false;
            }
        }

        if (connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                console.log("🔄 Koneksi terputus, mencoba lagi...");
                setTimeout(() => start(), 10000);
            }
        } else if (connection === "open") {
            console.log("🎊 BOT BERHASIL TERHUBUNG!");
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

start();
