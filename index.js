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
    initListPrMingguanScheduler,
    getWeekDates,
    sendJadwalBesokManual 
} = require('./scheduler'); 

// --- SISTEM PENYIMPANAN STATUS PER FITUR ---
const CONFIG_PATH = path.join(__dirname, 'config.json');
let botConfig = { 
    quiz: true,
    jadwalBesok: true,
    smartFeedback: true,
    prMingguan: true
};

// Muat status dari file agar permanen
if (fs.existsSync(CONFIG_PATH)) {
    try {
        const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
        botConfig = JSON.parse(data);
    } catch (e) { 
        console.error("Gagal memuat config.json, menggunakan default."); 
    }
}

const saveConfig = () => {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(botConfig, null, 2));
};

// --- LOGIKA DATABASE KUIS (Agar aman kalau mati) ---
const KUIS_PATH = './kuis.json';
let kuisAktif = { msgId: null, data: null, votes: {}, targetJam: null, tglID: null, expiresAt: null };

if (fs.existsSync(KUIS_PATH)) {
    try {
        const savedKuis = JSON.parse(fs.readFileSync(KUIS_PATH, 'utf-8'));
        const now = new Date();
        const tglSekarang = `${now.getDate()}-${now.getMonth()}`;
        if (savedKuis.tglID === tglSekarang) {
            kuisAktif = savedKuis;
            console.log("✅ Data kuis berhasil dimuat ulang dari file.");
        }
    } catch (e) { console.error("Gagal memuat kuis.json"); }
}

const app = express();
const port = process.env.PORT || 8080; 
let qrCodeData = ""; 
let isConnected = false; 
let sock; 
let isStarting = false;

// --- SISTEM MONITORING & STATISTIK ---
let logs = [];
let stats = { 
    pesanMasuk: 0, 
    totalLog: 0 
};

const addLog = (msg) => {
    const time = new Date().toLocaleTimeString('id-ID');
    logs.unshift(`<span style="color: #007bff;">[${time}]</span> ${msg}`);
    stats.totalLog++;
    if (logs.length > 100) logs.pop();
};

app.use(express.urlencoded({ extended: true }));

// --- API UNTUK TOGGLE FITUR ---
app.get("/toggle/:feature", (req, res) => {
    const feat = req.params.feature;
    if (botConfig.hasOwnProperty(feat)) {
        botConfig[feat] = !botConfig[feat];
        saveConfig();
        addLog(`Fitur ${feat} diubah menjadi: ${botConfig[feat] ? 'ON' : 'OFF'}`);
    }
    res.redirect("/");
});

// --- 1. WEB SERVER UI (WHITE THEME) ---
app.get("/", (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    const totalRAM = (os.totalmem() / (1024 ** 3)).toFixed(2);
    const usedRAM = ((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(2);
    const uptime = (os.uptime() / 3600).toFixed(1);

    const commonHead = `
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
            body { background: #f4f7f6; color: #333; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            .card { background: #ffffff; border: none; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
            .status-online { color: #28a745; font-weight: bold; }
            .status-dot { height: 12px; width: 12px; border-radius: 50%; display: inline-block; margin-right: 8px; }
            .dot-online { background-color: #28a745; box-shadow: 0 0 10px #28a745; animation: pulse 1.5s infinite; }
            @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
            .log-box { 
                background: #fdfdfd; border-radius: 10px; height: 300px; overflow-y: auto; padding: 15px; 
                font-family: 'Consolas', 'Monaco', monospace; font-size: 0.85rem; color: #444; 
                border: 1px solid #eee; line-height: 1.6;
            }
            .stats-item { background: #f8f9fa; border: 1px solid #eee !important; color: #333 !important; }
            .stats-item small { color: #6c757d !important; font-weight: 600; text-transform: uppercase; font-size: 0.7rem; }
            .qr-container { background: #fff; padding: 20px; border-radius: 15px; border: 1px solid #eee; display: inline-block; }
            .btn-refresh { background: #007bff; border: none; font-weight: 600; color: white; width: 100%; padding: 10px; border-radius: 8px; }
            
            .feature-list { background: #fff; padding: 5px; border-radius: 10px; margin-bottom: 20px; }
            .feature-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 10px; border-bottom: 1px solid #f1f1f1; }
            .feature-item:last-child { border-bottom: none; }
            .btn-toggle { border: none; padding: 6px 16px; border-radius: 8px; font-weight: bold; font-size: 0.8rem; min-width: 75px; transition: 0.2s; }
            .btn-on { background: #d4edda; color: #155724; }
            .btn-off { background: #f8d7da; color: #721c24; }
            .btn-nav { background: #fff; border: 1px solid #ddd; padding: 8px 15px; border-radius: 8px; margin-bottom: 15px; font-weight: 500; text-decoration: none; color: #555; display: inline-block; }
            .btn-nav:hover { background: #f1f1f1; }
            a { text-decoration: none; }
        </style>
    `;

    if (isConnected) {
        return res.send(`
            <html>
                <head><title>Bot Dashboard</title>${commonHead}</head>
                <body class="py-4">
                    <div class="container" style="max-width: 650px;">
                        <div class="card p-4">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <h4 class="mb-0">WhatsApp Bot Dashboard</h4>
                                    <small class="text-muted">System Active on Port 8080</small>
                                </div>
                                <div class="text-end">
                                    <span class="status-dot dot-online"></span>
                                    <span class="status-online">CONNECTED</span>
                                </div>
                            </div>

                            <div class="mb-3">
                                <span class="text-muted small fw-bold text-uppercase">Menu Control:</span>
                            </div>

                            <div class="feature-list border mb-4">
                                <div class="feature-item">
                                    <div><strong>initQuizScheduler</strong><br><small class="text-muted">Kuis Harian Otomatis</small></div>
                                    <a href="/toggle/quiz"><button class="btn-toggle ${botConfig.quiz ? 'btn-on' : 'btn-off'}">${botConfig.quiz ? 'ON' : 'OFF'}</button></a>
                                </div>
                                <div class="feature-item">
                                    <div><strong>initJadwalBesokScheduler</strong><br><small class="text-muted">Notif Pelajaran Besok</small></div>
                                    <a href="/toggle/jadwalBesok"><button class="btn-toggle ${botConfig.jadwalBesok ? 'btn-on' : 'btn-off'}">${botConfig.jadwalBesok ? 'ON' : 'OFF'}</button></a>
                                </div>
                                <div class="feature-item">
                                    <div><strong>initSmartFeedbackScheduler</strong><br><small class="text-muted">Respon Pintar Sistem</small></div>
                                    <a href="/toggle/smartFeedback"><button class="btn-toggle ${botConfig.smartFeedback ? 'btn-on' : 'btn-off'}">${botConfig.smartFeedback ? 'ON' : 'OFF'}</button></a>
                                </div>
                                <div class="feature-item">
                                    <div><strong>initListPrMingguanScheduler</strong><br><small class="text-muted">Rekap PR Mingguan</small></div>
                                    <a href="/toggle/prMingguan"><button class="btn-toggle ${botConfig.prMingguan ? 'btn-on' : 'btn-off'}">${botConfig.prMingguan ? 'ON' : 'OFF'}</button></a>
                                </div>
                            </div>

                            <div class="row g-2 mb-4 text-center">
                                <div class="col-3"><div class="p-2 rounded stats-item"><small class="d-block">RAM</small><strong>${usedRAM}G</strong></div></div>
                                <div class="col-3"><div class="p-2 rounded stats-item"><small class="d-block">UPTIME</small><strong>${uptime}H</strong></div></div>
                                <div class="col-3"><div class="p-2 rounded stats-item"><small class="d-block">CHAT</small><strong>${stats.pesanMasuk}</strong></div></div>
                                <div class="col-3"><div class="p-2 rounded stats-item"><small class="d-block">LOGS</small><strong>${stats.totalLog}</strong></div></div>
                            </div>

                            <h6 class="mb-2 text-muted fw-bold small text-uppercase">Live Activity Log:</h6>
                            <div class="log-box mb-4">${logs.map(l => `<div>${l}</div>`).join('') || '<div class="text-muted">Waiting for activity...</div>'}</div>
                            
                            <div class="d-flex gap-2">
                                <button class="btn-refresh" onclick="location.reload()">REFRESH DASHBOARD</button>
                            </div>
                        </div>
                    </div>
                    <script>setTimeout(() => { location.reload(); }, 15000);</script>
                </body>
            </html>
        `);
    }

    if (qrCodeData) {
        return res.send(`
            <html>
                <head><title>Scan QR Code</title>${commonHead}</head>
                <body class="d-flex align-items-center justify-content-center vh-100">
                    <div class="card p-5 text-center shadow" style="max-width: 400px;">
                        <h4 class="mb-3">WhatsApp Connection</h4>
                        <div class="qr-container mb-3"><img src="${qrCodeData}" class="img-fluid"/></div>
                        <p class="text-muted small">Buka WhatsApp > Perangkat Tertaut > Scan QR ini untuk memulai bot.</p>
                        <script>setTimeout(() => { location.reload(); }, 15000);</script>
                    </div>
                </body>
            </html>
        `);
    }

    res.send(`
        <html><head>${commonHead}</head><body class="d-flex align-items-center justify-content-center vh-100 text-center">
            <div><div class="spinner-border text-primary mb-3"></div><h3 class="text-muted">SYSTEM BOOTING...</h3></div>
            <script>setTimeout(() => { location.reload(); }, 4000);</script>
        </body></html>
    `);
});

// --- LOGIKA UTAMA BOT ---
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
            getMessage: async (key) => { return { conversation: undefined } }
        });

        sock.ev.on("creds.update", saveCreds);

        sock.ev.on('messages.update', async (updates) => {
            for (const update of updates) {
                if (update.update.pollUpdates && kuisAktif && kuisAktif.msgId === update.key.id) {
                    const pollUpdate = update.update.pollUpdates[0];
                    if (pollUpdate) {
                        const voter = pollUpdate.voterJid;
                        kuisAktif.votes[voter] = pollUpdate.selectedOptions;
                        addLog(`Vote dicatat: ${voter.split('@')[0]}`);
                        fs.writeFileSync(KUIS_PATH, JSON.stringify(kuisAktif, null, 2));
                    }
                }
            }
        });

        sock.ev.on('call', async (node) => {
            for (const call of node) {
                if (call.status === 'offer') {
                    addLog(`Panggilan masuk ditolak: ${call.from.split('@')[0]}`);
                    try { await sock.rejectCall(call.id, call.from); } catch (e) { }
                }
            }
        });

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
                addLog(`Terputus. Alasan: ${reason}`);
                if (reason !== DisconnectReason.loggedOut) { setTimeout(start, 5000); }
            } else if (connection === "open") {
                qrCodeData = ""; 
                isConnected = true;
                isStarting = false;
                addLog("Bot Terhubung!");
                
                await delay(2000);
                
                // JALANKAN SCHEDULER BERDASARKAN CONFIG
                if (botConfig.quiz) initQuizScheduler(sock, kuisAktif);
                if (botConfig.jadwalBesok) initJadwalBesokScheduler(sock);
                if (botConfig.smartFeedback) initSmartFeedbackScheduler(sock, kuisAktif); 
                if (botConfig.prMingguan) initListPrMingguanScheduler(sock);
                
                addLog("Sistem Aktif (Scheduler Sesuai Config)");
            }
        });

        sock.ev.on("messages.upsert", async (m) => {
            if (m.type === 'notify') {
                const msg = m.messages[0];
                if (!msg.message || msg.key.fromMe) return;

                stats.pesanMasuk++;
                addLog(`Pesan: ${msg.pushName || msg.key.remoteJid.split('@')[0]}`);

                try {
                    await handleMessages(sock, m, kuisAktif, { 
                        getWeekDates, 
                        sendJadwalBesokManual 
                    });
                } catch (err) {
                    console.error("❌ Error Handler:", err);
                }
            }
        });

    } catch (err) {
        addLog(`Error Fatal: ${err.message}`);
        isStarting = false;
        setTimeout(start, 5000);
    }
}

start();
app.listen(port, "0.0.0.0", () => {
    console.log(`🌐 Dashboard: http://localhost:${port}`);
});
    
