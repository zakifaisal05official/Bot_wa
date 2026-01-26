const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore 
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const QRCode = require("qrcode");
const { handleMessages } = require('./handler');

const app = express();
const port = process.env.PORT || 3000;
let qrCodeData = ""; 

// Web Server untuk cek status & scan QR
app.get("/", (req, res) => {
    if (qrCodeData) {
        res.send(`<html><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#f0f2f5;font-family:sans-serif;margin:0;"><div style="background:white;padding:30px;border-radius:20px;box-shadow:0 4px 15px rgba(0,0,0,0.1);text-align:center;"><h2 style="color:#075e54;margin-bottom:20px;">Scan QR Bot WhatsApp</h2><img src="${qrCodeData}" style="width:280px;height:280px;"/><p style="color:#666;margin-top:20px;">Gunakan WhatsApp di HP kamu untuk menautkan perangkat.</p></div></body></html>`);
    } else {
        res.send(`<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;background:#25d366;font-family:sans-serif;margin:0;color:white;text-align:center;"><div><h1>✅ Bot Terhubung</h1><p>Bot sedang aktif dan siap menerima pesan.</p></div></body></html>`);
    }
});

// Menjalankan Web Server
app.listen(port, "0.0.0.0", () => {
    console.log(`✅ [SERVER] Web Dashboard siap di port: ${port}`);
});

async function start() {
    console.log("🚀 [SYSTEM] Mencoba menjalankan bot...");
    
    try {
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`📦 [SYSTEM] Menggunakan WA Version: ${version.join('.')} (Latest: ${isLatest})`);

        const { state, saveCreds } = await useMultiFileAuthState('auth_info');

        const sock = makeWASocket({
            version,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
            },
            logger: pino({ level: "silent" }),
            printQRInTerminal: true,
            browser: ["Chrome (Linux)", "Chrome", "110.0.0"],
            syncFullHistory: false,
            markOnlineOnConnect: true,
            cachedGroupMetadata: async (jid) => undefined,
            getMessage: async (key) => { return { conversation: 'Refreshing...' } }
        });

        // Simpan kredensial
        sock.ev.on("creds.update", saveCreds);

        // Tangani Pesan
        sock.ev.on("messages.upsert", async (m) => {
            try {
                await handleMessages(sock, m);
            } catch (err) {
                console.error("❌ [ERROR] Handler:", err);
            }
        });

        // Tangani Koneksi
        sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                qrCodeData = await QRCode.toDataURL(qr);
                console.log("📸 [SYSTEM] QR Code baru telah dibuat, silakan cek dashboard.");
            }

            if (connection === "close") {
                const reason = lastDisconnect?.error?.output?.statusCode;
                console.log(`⚠️ [SYSTEM] Koneksi terputus (Reason: ${reason})`);

                if (reason !== DisconnectReason.loggedOut) {
                    console.log("🔄 [SYSTEM] Menghubungkan ulang...");
                    start();
                } else {
                    console.log("❌ [SYSTEM] Sesi Logout. Hapus folder auth_info.");
                    process.exit();
                }
            } else if (connection === "open") {
                qrCodeData = ""; 
                console.log("🎊 [SUCCESS] BOT TELAH TERHUBUNG!");
            }
        });

    } catch (error) {
        console.error("❌ [CRITICAL] Gagal menjalankan bot:", error);
    }
}

// Menjalankan fungsi start
start();
