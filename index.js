const { default: makeWASocket, useMultiFileAuthState, delay, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false, // Matikan QR agar log tidak penuh
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    const nomorHP = "6285158738155";
    let sudahMintaKode = false; // Kunci agar tidak minta berkali-kali

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // Jika ada QR dan belum login, minta Pairing Code
        if (qr && !sock.authState.creds.registered && !sudahMintaKode) {
            sudahMintaKode = true; 
            
            console.log("\n----------------------------------------");
            console.log("⏳ Sedang meminta KODE PAIRING...");
            console.log("----------------------------------------");

            // Tunggu 10 detik agar koneksi benar-benar stabil
            await delay(10000); 

            try {
                const code = await sock.requestPairingCode(nomorHP);
                console.log("\n========================================");
                console.log("🔥 KODE PAIRING ANDA: " + code);
                console.log("========================================");
                console.log("Input di WA HP > Perangkat Tertaut");
                console.log("========================================\n");
            } catch (e) {
                console.log("❌ Gagal ambil kode. Restarting...");
                sudahMintaKode = false; // Reset agar bisa coba lagi kalau gagal total
            }
        }

        if (connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                console.log("Koneksi terputus, menghubungkan ulang...");
                start();
            }
        } else if (connection === "open") {
            console.log("🎊 BOT BERHASIL TERHUBUNG!");
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

start();
