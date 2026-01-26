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

// --- BAGIAN 1: WEB SERVER (Dijalankan Duluan) ---
app.get("/", (req, res) => {
    if (qrCodeData) {
        res.send(`<html><body style="text-align:center;font-family:sans-serif;"><h2>Scan QR Bot</h2><img src="${qrCodeData}" /><p>Scan lewat WhatsApp HP</p></body></html>`);
    } else {
        res.send(`<html><body style="text-align:center;font-family:sans-serif;background:#25d366;color:white;"><h1>✅ Bot Terhubung</h1></body></html>`);
    }
});

app.listen(port, "0.0.0.0", () => {
    console.log("==========================================");
    console.log(`🌐 SERVER CLOUD AKTIF DI PORT: ${port}`);
    console.log("==========================================");
});

// --- BAGIAN 2: LOGIKA WHATSAPP ---
async function start() {
    console.log("📩 Sedang memuat sesi WhatsApp...");
    
    try {
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
            browser: ["Linux", "Chrome", "110.0.0"],
            // Solusi No Session
            cachedGroupMetadata: async (jid) => undefined,
            getMessage: async () => ({ conversation: 'resync' })
        });

        sock.ev.on("creds.update", saveCreds);

        sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                qrCodeData = await QRCode.toDataURL(qr);
                console.log("📸 [QR] Tampilan baru tersedia di web.");
            }

            if (connection === "close") {
                const reason = lastDisconnect?.error?.output?.statusCode;
                console.log(`⚠️ Terputus: ${reason}`);
                if (reason !== DisconnectReason.loggedOut) {
                    start();
                }
            } else if (connection === "open") {
                qrCodeData = ""; 
                console.log("🎊 [BERHASIL] Bot siap digunakan!");
            }
        });

        sock.ev.on("messages.upsert", async (m) => {
            await handleMessages(sock, m);
        });

    } catch (err) {
        console.error("❌ ERROR FATAL:", err.message);
    }
}

// Jalankan Bot
start();
