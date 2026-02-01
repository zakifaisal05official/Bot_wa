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
const fs = require("fs");

// --- IMPORT DARI HANDLER & SCHEDULER ---
const { handleMessages } = require('./handler'); 
const { 
    initQuizScheduler, 
    initJadwalBesokScheduler, 
    initSmartFeedbackScheduler,
    getWeekDates 
} = require('./scheduler'); 

let kuisAktif = { msgId: null, data: null, votes: {}, targetJam: null, tglID: null };

// Tambahan Variabel Statistik
let stats = { incoming: 0, system: 0 };

const app = express();
const port = process.env.PORT || 3000;
let qrCodeData = ""; 
let isConnected = false; 
let sock; 
let isStarting = false;

// --- SISTEM MONITORING LOG ---
let logs = [];
const addLog = (msg) => {
    const time = new Date().toLocaleTimeString('id-ID');
    logs.unshift(`<span style="color: #00a884;">[${time}]</span> ${msg}`);
    if (logs.length > 50) logs.pop();
    stats.system++; // Hitung setiap log sistem
};

app.use(express.urlencoded({ extended: true }));

// --- 1. WEB SERVER UI ---
app.get("/", (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    const totalRAM = (os.totalmem() / (1024 ** 3)).toFixed(2);
    const usedRAM = ((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(2);
    const uptime = (os.uptime() / 3600).toFixed(1);

    const commonHead = `
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
            body { background: #0b141a; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            .card { background: #1f2c33; border: 1px solid #2a3942; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            .status-online { color: #00ff73; font-weight: bold; text-shadow: 0 0 8px rgba(0,255,115,0.4); }
            .status-offline { color: #ff3b3b; font-weight: bold; }
            .status-dot { height: 12px; width: 12px; border-radius: 50%; display: inline-block; margin-right: 8px; }
            .dot-online { background-color: #00ff73; box-shadow: 0 0 12px #00ff73; animation: pulse 1.5s infinite; }
            .dot-offline { background-color: #ff3b3b; }
            @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
            .log-box { background: #0c151b; border-radius: 8px; height: 300px; overflow-y: auto; padding: 15px; font-family: 'Consolas', 'Monaco', monospace; font-size: 0.9rem; color: #e9edef; border: 1px solid #374045; line-height: 1.6; }
            .stats-item { background: #2a3942; border: 1px solid #374045 !important; color: #ffffff !important; }
            .stats-item small { color: #00a884 !important; font-weight: 600; text-transform: uppercase; font-size: 0.7rem; }
            .qr-container { background: white; padding: 20px; border-radius: 15px; display: inline-block; }
            .btn-restart { background: #ea0038; color: white; border: none; font-weight: 600; transition: 0.3s; }
            .btn-restart:hover { background: #ff2b51; color: white; transform: scale(1.02); }
            .btn-primary { background: #00a884; border: none; font-weight: 600; }
            .btn-primary:hover { background: #008f70; }
        </style>
    `;

    if (isConnected) {
        return res.send(`
            <html>
                <head><title>Monitor Bot Syteam</title>${commonHead}</head>
                <body class="py-5">
                    <div class="container" style="max-width: 600px;">
                        <div class="card p-4">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <h4 class="mb-0">WhatsApp Bot Monitor</h4>
                                    <small style="color: #8696a0;">v2.1 Stable Edition</small>
                                </div>
                                <div class="text-end">
                                    <span class="status-dot dot-online"></span>
                                    <span class="status-online">ONLINE</span>
                                </div>
                            </div>

                            <div class="row g-2 mb-4 text-center">
                                <div class="col-6 col-md-3">
                                    <div class="p-2 rounded stats-item">
                                        <small class="d-block">RAM</small>
                                        <strong>${usedRAM}GB</strong>
                                    </div>
                                </div>
                                <div class="col-6 col-md-3">
                                    <div class="p-2 rounded stats-item">
                                        <small class="d-block">Uptime</small>
                                        <strong>${uptime}H</strong>
                                    </div>
                                </div>
                                <div class="col-6 col-md-3">
                                    <div class="p-2 rounded stats-item">
                                        <small class="d-block">In Chat</small>
                                        <strong>${stats.incoming}</strong>
                                    </div>
                                </div>
                                <div class="col-6 col-md-3">
                                    <div class="p-2 rounded stats-item">
                                        <small class="d-block">Logs</small>
                                        <strong>${stats.system}</strong>
                                    </div>
                                </div>
                            </div>

                            <h6 class="mb-2" style="color: #e9edef;">System & Message Logs:</h6>
                            <div class="log-box mb-4">
                                ${logs.map(l => `<div>${l}</div>`).join('') || '<div style="color: #8696a0;">Menunggu aktivitas...</div>'}
                            </div>

                            <div class="d-grid gap-2">
                                <button class="btn btn-primary" onclick="location.reload()">Refresh Log</button>
                                <a href="/restart" onclick="return confirm('Apakah Anda yakin ingin me-restart bot?')" class="btn btn-restart">Restart System</a>
                            </div>
                        </div>
                    </div>
                    <script>setTimeout(() => { location.reload(); }, 10000);</script>
                </body>
            </html>
        `);
    }

    if (qrCodeData) {
        return res.send(`
            <html>
                <head><title>Scan WhatsApp</title>${commonHead}</head>
                <body class="d-flex align-items-center justify-content-center vh-100">
                    <div class="card p-4 text-center" style="max-width: 400px;">
                        <h4 class="mb-3">Link WhatsApp</h4>
                        <div class="qr-container mb-3"><img src="${qrCodeData}" class="img-fluid"/></div>
                        <p style="color: #8696a0;">Buka WhatsApp > Perangkat Tertaut > Scan QR ini.</p>
                        <script>setTimeout(() => { location.reload(); }, 15000);</script>
                    </div>
                </body>
            </html>
        `);
    }

    res.send(`
        <html><head><title>Booting...</title>${commonHead}</head>
        <body class="d-flex align-items-center justify-content-center vh-100 text-center">
            <div><div class="spinner-grow text-success mb-3" role="status"></div><h3>SYSTEM BOOTING...</h3></div>
            <script>setTimeout(() => { location.reload(); }, 4000);</script>
        </body></html>
    `);
});

app.get("/restart", (req, res) => {
    res.send(`<body style="background:#0b141a; color:white; text-align:center; padding-top:100px;"><h3>♻️ Restarting...</h3><script>setTimeout(() => { window.location.href='/'; }, 8000);</script></body>`);
    setTimeout(() => process.exit(0), 2000);
});

app.listen(port, "0.0.0.0", () => {
    console.log(`🌐 Dashboard: http://localhost:${port}`);
});

// --- 2. LOGIKA UTAMA BOT ---
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
        });

        sock.ev.on("creds.update", saveCreds);

        sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect, qr } = update;
            if (qr) {
                qrCodeData = await QRCode.toDataURL(qr);
                isConnected = false;
                addLog("QR Code baru dihasilkan.");
            }
            if (connection === "close") {
                isConnected = false;
                qrCodeData = "";
                isStarting = false;
                const reason = lastDisconnect?.error?.output?.statusCode;
                if (reason !== DisconnectReason.loggedOut) {
                    setTimeout(start, 5000);
                } else {
                    addLog("Sesi Logout! Membersihkan auth_info...");
                    fs.rmSync(path.join(__dirname, 'auth_info'), { recursive: true, force: true });
                    setTimeout(start, 3000);
                }
            } else if (connection === "open") {
                qrCodeData = ""; 
                isConnected = true;
                isStarting = false;
                addLog("Bot Terhubung!");
                await delay(2000);
                initQuizScheduler(sock, kuisAktif);
                initJadwalBesokScheduler(sock);
                initSmartFeedbackScheduler(sock, kuisAktif); 
            }
        });

        sock.ev.on("messages.upsert", async (m) => {
            if (m.type === 'notify') {
                const msg = m.messages[0];
                if (!msg.message || msg.key.fromMe) return;
                
                stats.incoming++; // Tambah hitungan pesan
                const from = msg.pushName || msg.key.remoteJid.split('@')[0];
                const content = msg.message.conversation || msg.message.extendedTextMessage?.text || "[Media]";
                addLog(`Pesan: ${from} -> ${content.substring(0, 20)}`);

                try {
                    await handleMessages(sock, m, kuisAktif, { getWeekDates });
                } catch (err) { console.error(err); }
            }
        });

    } catch (err) {
        isStarting = false;
        setTimeout(start, 5000);
    }
}

start();
                                            
