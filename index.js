const { default: makeWASocket, useMultiFileAuthState, delay, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");

async function start() {
    // Menggunakan folder 'session_final' agar sesi rusak yang lama tidak terbawa
    const { state, saveCreds } = await useMultiFileAuthState('session_final');
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false, // QR Tetap mati sesuai permintaan
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    const nomorHP = "6285158738155";
    let sedangProsesPairing = false; 

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // Logika Pairing Code
        if (qr && !sock.authState.creds.registered && !sedangProsesPairing) {
            sedangProsesPairing = true;
            
            console.log("\n----------------------------------------");
            console.log("🌐 Menunggu jaringan stabil (20 detik)...");
            console.log("----------------------------------------");

            // Jeda 20 detik agar server Railway siap 100%
            await delay(20000); 

            try {
                console.log("📨 Mengirim permintaan kode ke WhatsApp...");
                const code = await sock.requestPairingCode(nomorHP);
                console.log("\n========================================");
                console.log("🔥 KODE PAIRING ANDA: " + code);
                console.log("========================================");
                console.log("Buka WA HP > Perangkat Tertaut > Tautkan dg No Telp");
                console.log("========================================\n");
            } catch (e) {
                console.log("❌ Gagal mengambil kode. Menunggu 30 detik untuk coba lagi...");
                sedangProsesPairing = false;
                await delay(30000);
            }
        }

        // Logika Reconnect agar tidak looping terus-menerus
        if (connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode;
            console.log(`⚠️ Koneksi Terputus (Kode: ${reason})`);
            
            if (reason !== DisconnectReason.loggedOut) {
                console.log("🔄 Mencoba hubungkan ulang dalam 10 detik...");
                setTimeout(() => start(), 10000); // Jeda 10 detik sebelum restart bot
            }
        } else if (connection === "open") {
            console.log("🎊 BOT SUDAH AKTIF DAN TERHUBUNG!");
            sedangProsesPairing = false;
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

start();
