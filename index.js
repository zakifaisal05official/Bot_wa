const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys");
const pino = require("pino");
// qrcode-terminal dihapus karena QR dimatikan

async function start() {
    // Gunakan folder sesi baru 'session_final' agar tidak bentrok dengan yang error tadi
    const { state, saveCreds } = await useMultiFileAuthState('session_final');
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false, // QR SUDAH DIMATIKAN
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    const nomorHP = "6285158738155";
    let sudahMinta = false; // Flag agar tidak spam permintaan kode

    sock.ev.on("connection.update", async (update) => {
        const { qr, connection } = update;

        // Jika ada sinyal QR (tapi tidak dicetak) dan belum terdaftar
        if (qr && !sock.authState.creds.registered && !sudahMinta) {
            sudahMinta = true; 
            
            const mintaKode = async () => {
                try {
                    console.log("\n⏳ Sedang meminta KODE PAIRING...");
                    // Jeda sedikit lebih lama agar koneksi Railway stabil dulu
                    await delay(10000); 
                    const code = await sock.requestPairingCode(nomorHP);
                    console.log("\n========================================");
                    console.log("🔥 KODE PAIRING ANDA: " + code);
                    console.log("========================================");
                    console.log("Input di WA HP > Perangkat Tertaut");
                    console.log("========================================\n");
                } catch (e) {
                    console.log("Gagal ambil kode, mencoba lagi...");
                    sudahMinta = false;
                    setTimeout(mintaKode, 15000);
                }
            };
            mintaKode();
        }
        
        if (connection === "open") {
            console.log("🎊 TERHUBUNG!");
        }

        if (connection === "close") {
            console.log("🔄 Koneksi terputus, mencoba hubungkan kembali...");
            start();
        }
    });

    sock.ev.on("creds.update", saveCreds);
}
start();
