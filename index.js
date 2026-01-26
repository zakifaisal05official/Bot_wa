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

// --- UPDATE IMPORT (Menambahkan initJadwalBesokScheduler) ---
const { handleMessages, initQuizScheduler, initJadwalBesokScheduler } = require('./handler'); 

const app = express();
const port = process.env.PORT || 3000;
let qrCodeData = ""; 
let isConnected = false; 
let sock; 

// --- 1. WEB SERVER UI ---
app.get("/", (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    if (isConnected) {
        return res.send(`
            <html>
                <head>
                    <title>Bot Status</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                    <style>
                        body { background: #075e54; display: flex; align-items: center; justify-content: center; height: 100vh; color: white; margin: 0; font-family: sans-serif; }
                        .card { background: white; color: #333; border-radius: 15px; padding: 2rem; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
                        .dot { height: 15px; width: 15px; background-color: #25d366; border-radius: 50%; display: inline-block; margin-right: 10px; animation: pulse 1.5s infinite; }
                        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <div class="d-flex align-items-center justify-content-center mb-3">
                            <span class="dot"></span>
                            <h2 class="mb-0">BOT ONLINE</h2>
                        </div>
                        <p class="text-muted">Sesi aktif. Bot siap menerima perintah.</p>
                        <hr>
                        <button class="btn btn-success w-100" onclick="location.reload()">Cek Status Lagi</button>
                    </div>
                </body>
            </html>
        `);
    }

    if (qrCodeData) {
        res.send(`
            <html>
                <head>
                    <title>Scan WhatsApp</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                    <style>
                        body { background: #f0f2f5; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; }
                        .card { border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); padding: 30px; text-align: center; background: white; max-width: 400px; }
                        img { width: 100%; border: 1px solid #ddd; border-radius: 10px; padding: 10px; background: #fff; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h4 class="mb-4 text-primary">Scan QR Code</h4>
                        <img src="${qrCodeData}" />
                        <p class="mt-3 text-secondary small">Buka WhatsApp > Perangkat Tertaut > Scan QR ini</p>
                        <script>setTimeout(() => { location.reload(); }, 15000);</script>
                    </div>
                </body>
            </html>
        `);
    } else {
        res.send(`<div style="text-align:center; padding-top: 50px; font-family:sans-serif;"><h3>Memuat QR Code...</h3><p>Tunggu sebentar atau refresh halaman.</p><script>setTimeout(() => { location.reload(); }, 5000);</script></div>`);
    }
});

app.listen(port, "0.0.0.0", () => {
    console.log(`🌐 Dashboard: http://localhost:${port}`);
});

// --- 2. LOGIKA WHATSAPP ---

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
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            getMessage: async (key) => {
                return { conversation: undefined }
            }
        });

        sock.ev.on("creds.update", saveCreds);

        // --- FITUR AUTO REJECT CALL ---
        sock.ev.on('call', async (node) => {
            for (const call of node) {
                if (call.status === 'offer') {
                    await sock.rejectCall(call.id, call.from);
                    console.log(`📞 Panggilan dari ${call.from} otomatis ditolak.`);
                }
            }
        });

        sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                qrCodeData = await QRCode.toDataURL(qr);
                isConnected = false;
            }

            if (connection === "close") {
                isConnected = false;
                const reason = lastDisconnect?.error?.output?.statusCode;
                console.log("Koneksi terputus. Alasan:", reason);
                
                if (reason !== DisconnectReason.loggedOut) {
                    console.log("Mencoba menyambungkan kembali dalam 5 detik...");
                    setTimeout(start, 5000);
                } else {
                    console.log("Sesi Logout. Silakan hapus folder auth_info dan scan ulang.");
                }
            } else if (connection === "open") {
                qrCodeData = ""; 
                isConnected = true;
                console.log("🎊 [BERHASIL] Bot sudah online!");
                
                // --- UPDATE: AKTIFKAN PENJADWALAN POLLING & JADWAL BESOK ---
                initQuizScheduler(sock);
                initJadwalBesokScheduler(sock); // Menambahkan scheduler jam 17:00 WIB
            }
        });

        sock.ev.on("messages.upsert", async (m) => {
            if (m.type === 'notify') {
                await handleMessages(sock, m);
            }
        });

    } catch (err) {
        console.error("❌ ERROR UTAMA:", err);
        setTimeout(start, 5000);
    }
}

start();
