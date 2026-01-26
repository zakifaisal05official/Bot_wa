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
            // Menggunakan cache store untuk mempercepat pancingan session
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
        logger: pino({ level: "silent" }),
        printQRInTerminal: true,
        browser: ["Chrome (Linux)", "Chrome", "110.0.0"],
        
        // --- FIX SESSION ERROR SETTINGS ---
        syncFullHistory: false, 
        markOnlineOnConnect: true,
        defaultQueryTimeoutMs: undefined, // Mengurangi resiko timeout saat kirim grup
        
        // Memaksa pengambilan metadata grup agar tidak "No Sessions"
        cachedGroupMetadata: async (jid) => undefined, 
        
        // Fungsi pancingan enkripsi otomatis
        getMessage: async (key) => { 
            return { conversation: 'Bot session resync' } 
        } 
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async (m) => {
        try {
            // Beri sedikit jeda agar session stabil sebelum diproses handler
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

            if (reason !== DisconnectReason.loggedOut) {
                console.log("🔄 Menghubungkan kembali dalam 5 detik...");
                setTimeout(() => start(), 5000);
            } else {
                console.log("❌ Sesi Logout. Silakan hapus folder 'auth_info' di server/Railway dan scan ulang.");
                process.exit();
            }
        } else if (connection === "open") {
            qrCodeData = ""; 
            console.log("🎊 KONEKSI BERHASIL!");
        }
    });

    // Handle retry jika ada pesan gagal (untuk meminimalkan No Session)
    sock.ev.on('messages.update', async (chatUpdate) => {
        for (const { key, update } of chatUpdate) {
            if (update.pollUpdates || update.status) continue;
            if (update.messageStubType === 1) { // Jika ada error dekripsi
                console.log("Pancing ulang session untuk:", key.remoteJid);
                await sock.groupMetadata(key.remoteJid).catch(() => {});
            }
        }
    });

    return sock;
}

start();
