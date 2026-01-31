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
const os = require("os"); 
const path = require("path");

// --- IMPORT DARI HANDLER & SCHEDULER ---
const { handleMessages } = require('./handler'); 
const { 
    initQuizScheduler, 
    initJadwalBesokScheduler, 
    initSmartFeedbackScheduler,
    getWeekDates 
} = require('./scheduler'); 

let kuisAktif = { msgId: null, data: null, votes: {}, targetJam: null, tglID: null };

const app = express();
const port = process.env.PORT || 3000;
let qrCodeData = ""; 
let isConnected = false; 
let sock; 
let isStarting = false;

// Middleware untuk fitur broadcast
app.use(express.urlencoded({ extended: true }));

// --- 1. WEB SERVER UI (WhatsApp Style & New Features) ---
app.get("/", (req, res) => {
    res.setHeader('Content-Type', 'text/html');

    const totalMemBytes = os.totalmem();
    const freeMemBytes = os.freemem();
    const usedMemBytes = totalMemBytes - freeMemBytes;
    const totalRAM = (totalMemBytes / (1024 ** 3)).toFixed(2);
    const usedRAM = (usedMemBytes / (1024 ** 3)).toFixed(2);
    const uptime = (os.uptime() / 3600).toFixed(1);

    const commonHead = `
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
            body { background: #0b141a; color: #e9edef; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
            .card { background: #222e35; border: none; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); color: #e9edef; }
            .status-dot { height: 12px; width: 12px; background-color: #25d366; border-radius: 50%; display: inline-block; margin-right: 8px; box-shadow: 0 0 10px #25d366; }
            .info-box { background: #111b21; border-radius: 8px; padding: 15px; margin-top: 15px; border-left: 4px solid #00a884; }
            .btn-wa { background-color: #00a884; color: white; border: none; font-weight: 600; }
            .btn-wa:hover { background-color: #008f72; color: white; }
            .qr-container { background: white; padding: 15px; border-radius: 10px; display: inline-block; }
        </style>
    `;

    if (isConnected) {
        return res.send(`
            <html>
                <head><title>Gemini Bot Admin</title>${commonHead}</head>
                <body class="py-5">
                    <div class="container" style="max-width: 500px;">
                        <div class="card p-4">
                            <div class="d-flex align-items-center mb-4">
                                <span class="status-dot"></span>
                                <h4 class="mb-0">Bot Sistem Aktif</h4>
                            </div>
                            
                            <div class="info-box">
                                <small class="text-secondary d-block">Server Resource</small>
                                <strong>${usedRAM}GB / ${totalRAM}GB</strong>
                                <div class="mt-2 small">Uptime: ${uptime} Jam | OS: ${os.platform()}</div>
                            </div>

                            <div class="mt-4">
                                <h6>Fitur Kontrol:</h6>
                                <div class="d-grid gap-2">
                                    <a href="/restart" onclick="return confirm('Restart bot sekarang?')" class="btn btn-outline-danger btn-sm">Restart Bot Instance</a>
                                    <button class="btn btn-wa w-100 mt-2" onclick="location.reload()">Refresh Dashboard</button>
                                </div>
                            </div>

                            <hr class="my-4 border-secondary">

                            <h6>Kirim Broadcast Cepat:</h6>
                            <form action="/broadcast" method="POST">
                                <input type="text" name="jid" class="form-control mb-2 bg-dark text-white border-secondary" placeholder="Nomor (contoh: 62812xxx@s.whatsapp.net)" required>
                                <textarea name="message" class="form-control mb-2 bg-dark text-white border-secondary" placeholder="Tulis pesan..." required></textarea>
                                <button type="submit" class="btn btn-wa btn-sm w-100">Kirim Pesan</button>
                            </form>
                        </div>
                    </div>
                </body>
            </html>
        `);
    }

    if (qrCodeData) {
        res.send(`
            <html>
                <head><title>Link WhatsApp</title>${commonHead}</head>
                <body class="d-flex align-items-center justify-content-center vh-100">
                    <div class="card p-4 text-center" style="max-width: 380px;">
                        <h5 class="mb-4">Hubungkan WhatsApp</h5>
                        <div class="qr-container mb-3"><img src="${qrCodeData}" class="img-fluid"/></div>
                        <p class="text-secondary small">Buka WhatsApp > Perangkat Tertaut > Scan QR ini untuk memulai bot.</p>
                        <script>setTimeout(() => { location.reload(); }, 15000);</script>
                    </div>
                </body>
            </html>
        `);
    } else {
        res.send(`<body style="background:#0b141a;color:white;text-align:center;padding-top:100px;"><h3>Menghubungkan...</h3><script>setTimeout(()=>location.reload(), 3000);</script></body>`);
    }
});

// --- FITUR TAMBAHAN ---
app.get("/restart", (req, res) => {
    if (sock) sock.end();
    isStarting = false;
    isConnected = false;
    qrCodeData = "";
    setTimeout(() => start(), 3000);
    res.send("<script>alert('Perintah restart dikirim.'); window.location.href='/';</script>");
});

app.post("/broadcast", async (req, res) => {
    const { jid, message } = req.body;
    if (isConnected && sock) {
        await sock.sendMessage(jid, { text: message });
        res.send("<script>alert('Pesan terkirim!'); window.location.href='/';</script>");
    } else {
        res.send("<script>alert('Bot belum terhubung!'); window.location.href='/';</script>");
    }
});

app.listen(port, "0.0.0.0", () => {
    console.log(`🌐 Dashboard: http://localhost:${port}`);
});

// --- 2. LOGIKA WHATSAPP ---
async function start() {
    if (isStarting) return;
    isStarting = true;

    try {
        const { version } = await fetchLatestBaileysVersion();
        const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'auth_info'));

        sock = makeWASocket({
            version,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
            },
            logger: pino({ level: "silent" }),
            printQRInTerminal: false,
            browser: ["Ubuntu", "Chrome", "20.0.0.4"],
            getMessage: async (key) => {
                return { conversation: undefined }
            }
        });

        sock.ev.on("creds.update", saveCreds);

        sock.ev.on('messages.update', async (updates) => {
            for (const update of updates) {
                if (update.update.pollUpdates && kuisAktif && kuisAktif.msgId === update.key.id) {
                    const pollUpdate = update.update.pollUpdates[0];
                    if (pollUpdate) {
                        kuisAktif.votes[pollUpdate.voterJid] = pollUpdate.selectedOptions;
                    }
                }
            }
        });

        sock.ev.on('call', async (node) => {
            for (const call of node) {
                if (call.status === 'offer') {
                    try {
                        await sock.rejectCall(call.id, call.from);
                        const callerId = call.from.split('@')[0];
                        console.log(`📞 Panggilan dari ${callerId} otomatis ditolak.`);
                        await sock.sendMessage(call.from, { 
                            text: "⚠️ *BOT TIDAK MENERIMA PANGGILAN*\n\nMaaf, bot otomatis menolak telepon/video call. Silakan hubungi via chat saja." 
                        });
                    } catch (e) { /* ignore */ }
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
                qrCodeData = "";
                isStarting = false;
                const reason = lastDisconnect?.error?.output?.statusCode;
                
                console.log(`📡 Koneksi Terputus. Alasan: ${reason}`);
                
                if (reason !== DisconnectReason.loggedOut) {
                    console.log("🔄 Mencoba menyambung kembali dalam 5 detik...");
                    setTimeout(start, 5000);
                } else {
                    console.log("❌ Sesi keluar. Silakan hapus folder auth_info dan scan ulang.");
                }
            } else if (connection === "open") {
                qrCodeData = ""; 
                isConnected = true;
                isStarting = false;
                console.log("🎊 [BERHASIL] Bot sudah online!");
                
                await delay(2000);
                initQuizScheduler(sock, kuisAktif);
                initJadwalBesokScheduler(sock);
                initSmartFeedbackScheduler(sock, kuisAktif); 
            }
        });

        sock.ev.on("messages.upsert", async (m) => {
            if (m.type === 'notify') {
                try {
                    await handleMessages(sock, m, kuisAktif, { getWeekDates });
                } catch (err) {
                    console.error("❌ Error saat handle pesan:", err);
                }
            }
        });

    } catch (err) {
        console.error("❌ ERROR UTAMA:", err);
        isStarting = false;
        setTimeout(start, 5000);
    }
}

start();
            
