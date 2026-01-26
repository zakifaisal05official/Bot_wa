const { default: makeWASocket, useMultiFileAuthState, delay, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");

async function start() {
    // GANTI NAMA FOLDER SESI LAGI agar benar-benar fresh (pakai 'session_fix_final')
    const { state, saveCreds } = await useMultiFileAuthState('session_fix_final');
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        // Tambahkan opsi browser yang lebih spesifik agar WhatsApp tidak curiga
        browser: ["Chrome (Linux)", "Chrome", "110.0.5481.177"],
        connectTimeoutMs: 60000, // Tunggu 1 menit sebelum menyerah
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000
    });

    const nomorHP = "6285158738155";
    let sedangMintaKode = false;

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !sock.authState.creds.registered && !sedangMintaKode) {
            sedangMintaKode = true;
            
            console.log("\n🌐 Jaringan terdeteksi. Menunggu 25 detik agar stabil...");
            await delay(25000); 

            try {
                console.log("📨 Mengambil Kode Pairing untuk " + nomorHP + "...");
                const code = await sock.requestPairingCode(nomorHP);
                console.log("\n========================================");
                console.log("🔥 KODE PAIRING ANDA: " + code);
                console.log("========================================");
            } catch (e) {
                console.log("❌ Gagal: " + e.message);
                sedangMintaKode = false;
            }
        }

        if (connection === "close") {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            console.log(`⚠️ Terputus (Status: ${statusCode}). Mengulang...`);
            
            // Jika folder sesi rusak (401), lebih baik jangan langsung restart agar tidak loop
            if (statusCode === DisconnectReason.loggedOut) {
                console.log("Sesi dikeluarkan, silakan hapus folder session_fix_final.");
            } else {
                setTimeout(() => start(), 15000); // Jeda 15 detik sebelum coba lagi
            }
        } else if (connection === "open") {
            console.log("🎊 BOT BERHASIL TERHUBUNG!");
            sedangMintaKode = false;
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

start();
