const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore,
    delay 
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const QRCode = require("qrcode");
const { handleMessages } = require('./handler');

const app = express();
const port = process.env.PORT || 3000;
let qrCodeData = ""; 
let sock; 

// --- BAGIAN 1: WEB SERVER (UI MODERN) ---
app.get("/", (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    if (qrCodeData) {
        res.send(`
            <html>
                <head>
                    <title>WhatsApp Bot QR</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                    <style>
                        body { background: #f0f2f5; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; }
                        .card { border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); padding: 30px; text-align: center; background: white; max-width: 400px; width: 90%; }
                        img { width: 100%; height: auto; border: 1px solid #eee; border-radius: 15px; margin-bottom: 20px; padding: 10px; }
                        .status { color: #667781; font-weight: 500; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h4 class="mb-3 text-dark">Link Your WhatsApp</h4>
                        <img src="${qrCodeData}" />
                        <p class="status">Scan QR via WhatsApp di HP Anda</p>
                        <div class="spinner-grow text-success" role="status" style="width: 1rem; height: 1rem;"></div>
                        <p class="mt-3 text-muted" style="font-size: 0.75rem text-transform: uppercase;">Auto-refresh aktif (30s)</p>
                    </div>
                    <script>setTimeout(() => { location.reload(); }, 30000);</script>
                </body>
            </html>
        `);
    } else {
        res.send(`
            <html>
                <head>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                    <style>
                        body { background: #25d366; display: flex; align-items: center; justify-content: center; height: 100vh; color: white; text-align: center; }
                        .container { animation: fadeIn 1s; }
                        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1 class="display-3 fw-bold">✅ Bot Online</h1>
                        <p class="lead">Sesi berhasil dimuat. Bot siap menerima perintah.</p>
                    </div>
                </body>
            </html>
        `);
    }
});

app.listen(port, "0.0.0.0", () => {
    console.log(`🌐 SERVER CLOUD AKTIF DI PORT: ${port}`);
});

// --- BAGIAN 2: LOGIKA WHATSAPP ---

const sendToGroupSafe = async (jid, content) => {
    try {
        await sock.sendMessage(jid, {
            text: content.text,
            contextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2
            }
        }, { broadcast: true });
        return true;
    } catch (err) {
        try {
            await delay(2000);
            await sock.sendMessage(jid, content);
            return true;
        } catch (err2) {
            return false;
        }
    }
};

async function start() {
    try {
        const { version } = await fetchLatestBaileysVersion();
        const { state, saveCreds } = await useMultiFileAuthState('auth_info');

        sock = makeWASocket({
            version,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
            },
            logger: pino({ level: "silent" }),
            printQRInTerminal: true,
            browser: ["Linux", "Chrome", "110.0.0"],
            cachedGroupMetadata: async (jid) => undefined,
            getMessage: async () => ({ conversation: 'resync' })
        });

        sock.ev.on("creds.update", saveCreds);

        // --- FITUR: AUTO REJECT TELEPON ---
        sock.ev.on("call", async (calls) => {
            for (const call of calls) {
                if (call.status === "offer") {
                    console.log(`📞 Menolak panggilan dari: ${call.from}`);
                    
                    // Mematikan telepon secara paksa
                    await sock.rejectCall(call.id, call.from);
                    
                    // Mengirim pesan otomatis (agar penelpon tahu kenapa mati)
                    await sock.sendMessage(call.from, { 
                        text: "⚠️ *Pesan Otomatis*\nMaaf, bot tidak dapat menerima panggilan telepon/video. Silakan hubungi via chat saja." 
                    });
                }
            }
        });

        sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                qrCodeData = await QRCode.toDataURL(qr);
            }

            if (connection === "close") {
                const reason = lastDisconnect?.error?.output?.statusCode;
                if (reason !== DisconnectReason.loggedOut) {
                    start();
                }
            } else if (connection === "open") {
                qrCodeData = ""; 
                console.log("🎊 [BERHASIL] Bot siap digunakan!");
            }
        });

        sock.ev.on("messages.upsert", async (m) => {
            await handleMessages(sock, m, sendToGroupSafe);
        });

    } catch (err) {
        console.error("❌ ERROR FATAL:", err.message);
    }
}

start();
