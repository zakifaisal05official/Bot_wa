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

// Web Server status
app.get("/", (req, res) => {
    if (qrCodeData) {
        res.send(`
            <html>
                <head><title>WhatsApp Bot QR</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
                <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#f0f2f5;font-family:sans-serif;margin:0;">
                    <div style="background:white;padding:30px;border-radius:20px;box-shadow:0 4px 15px rgba(0,0,0,0.1);text-align:center;">
                        <h2 style="color:#075e54;margin-bottom:20px;">Scan QR Bot WhatsApp</h2>
                        <img src="${qrCodeData}" style="width:280px;height:280px;border: 1px solid #eee; padding: 10px; border-radius: 10px;"/>
                        <p style="color:#666;margin-top:20px;">Gunakan WhatsApp di HP kamu untuk menautkan perangkat.</p>
                    </div>
                </body>
            </html>
        `);
    } else {
        res.send(`
            <html>
                <body style="display:flex;align-items:center;justify-content:center;height:100vh;background:#25d366;font-family:sans-serif;margin:0;color:white;text-align:center;">
                    <div><h1>✅ Bot Terhubung</h1><p>Bot sedang aktif dan siap menerima pesan.</p></div>
                </body>
            </html>
        `);
    }
});

app.listen(port, () => console.log(`🌐 Web QR ready on port ${port}`));

async function start() {
    const { version } = await fetchLatestBaileysVersion();
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
        // --- TAMBAHAN UNTUK FIX SESSION ERROR ---
        syncFullHistory: false, // Mempercepat koneksi awal
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        getMessage: async (key) => { return { conversation: 'Refreshing session...' } } 
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async (m) => {
        try {
            await handleMessages(sock, m);
        } catch (err) {
            console.error("Error handling message:", err);
        }
    });

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrCodeData = await QRCode.toDataURL(qr);
            console.log("👉 QR Code baru tersedia di Web Dashboard.");
        }

        if (connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode;
            console.log("⚠️ Koneksi terputus. Reason code:", reason);

            // Logika Reconnect Otomatis kecuali jika Logout
            if (reason !== DisconnectReason.loggedOut) {
                console.log("🔄 Menghubungkan kembali dalam 5 detik...");
                setTimeout(() => start(), 5000);
            } else {
                console.log("❌ Sesi Logout. Hapus folder 'auth_info' dan scan ulang.");
                process.exit();
            }
        } else if (connection === "open") {
            qrCodeData = ""; 
            console.log("🎊 KONEKSI BERHASIL!");
        }
    });

    return sock;
}

start();
