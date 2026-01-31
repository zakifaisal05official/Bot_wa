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

const app = express();
const port = process.env.PORT || 3000;
let qrCodeData = ""; 
let isConnected = false; 
let sock; 
let isStarting = false;

// --- SISTEM LOG PESAN ---
let messageLogs = [];
const addLog = (sender, text) => {
    const time = new Date().toLocaleTimeString('id-ID');
    messageLogs.unshift({ time, sender, text }); 
    if (messageLogs.length > 20) messageLogs.pop(); 
};

app.use(express.urlencoded({ extended: true }));

// --- 1. WEB SERVER UI ---
app.get("/", (req, res) => {
    res.setHeader('Content-Type', 'text/html');

    const uptime = (os.uptime() / 3600).toFixed(1);

    const commonHead = `
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
            body { background: #0b141a; color: #e9edef; font-family: sans-serif; }
            .card { background: #222e35; border: none; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
            .status-dot { height: 12px; width: 12px; background-color: #25d366; border-radius: 50%; display: inline-block; margin-right: 8px; box-shadow: 0 0 10px #25d366; animation: pulse 1.5s infinite; }
            @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
            .log-container { background: #0b141a; border-radius: 8px; height: 300px; overflow-y: auto; padding: 10px; border: 1px solid #2a3942; }
            .log-item { border-bottom: 1px solid #2a3942; padding: 8px 0; font-size: 0.85rem; text-align: left; }
            .qr-container { background: white; padding: 15px; border-radius: 10px; display: inline-block; margin: 20px 0; }
        </style>
    `;

    if (isConnected) {
        const logsHtml = messageLogs.map(log => `
            <div class="log-item">
                <small style="color: #8696a0;">${log.time}</small><br>
                <strong style="color: #00a884;">${log.sender}:</strong> ${log.text}
            </div>
        `).join('') || '<div class="text-muted text-center py-5">Belum ada aktivitas</div>';

        return res.send(`
            <html>
                <head><title>Bot Monitor</title>${commonHead}</head>
                <body class="py-5">
                    <div class="container" style="max-width: 500px;">
                        <div class="card p-4 text-center">
                            <div class="d-flex align-items-center justify-content-between mb-4">
                                <div class="d-flex align-items-center"><span class="status-dot"></span><h4 class="mb-0">Bot Online</h4></div>
                                <a href="/restart" class="btn btn-outline-danger btn-sm">Restart</a>
                            </div>
                            <div class="mt-4 text-start">
                                <h6 class="mb-2">Log Aktivitas:</h6>
                                <div class="log-container">${logsHtml}</div>
                            </div>
                            <button class="btn btn-success w-100 mt-3" onclick="location.reload()">Refresh</button>
                        </div>
                    </div>
                </body>
            </html>
        `);
    }

    if (qrCodeData) {
        res.send(`
            <html><head><title>Scan QR</title>${commonHead}</head>
            <body class="d-flex align-items-center justify-content-center vh-100 text-center">
                <div class="card p-4 mx-3">
                    <h5 class="mb-2">Hubungkan WhatsApp</h5>
                    <p class="small text-secondary">Silakan scan kode QR di bawah ini</p>
                    <div class="qr-container"><img src="${qrCodeData}" class="img-fluid" style="min-width: 250px;"/></div>
                    <p class="text-secondary small">QR akan diperbarui otomatis tiap 15 detik</p>
                    <a href="/restart" class="btn btn-sm btn-link text-decoration-none">Gagal muncul? Klik Reset</a>
                    <script>setTimeout(() => { location.reload(); }, 15000);</script>
                </div>
            </body></html>
        `);
    } else {
        res.send(`
            <html><head><title>Booting...</title>${commonHead}</head>
            <body style="background:#0b141a;color:white;text-align:center;padding-top:150px;">
                <div class="spinner-border text-success mb-3" style="width: 3rem; height: 3rem;"></div>
                <h3>SEDANG MEMUAT QR...</h3>
                <p class="text-secondary">Jika ini memakan waktu lebih dari 30 detik, silakan refresh.</p>
                <script>setTimeout(()=>location.reload(), 5000);</script>
            </body></html>
        `);
    }
});

// --- FITUR RESTART & CLEAR SESSION ---
app.get("/restart", async (req, res) => {
    qrCodeData = "";
    isConnected = false;
    isStarting = false;
    if (sock) {
        try { sock.ev.removeAllListeners(); sock.end(); sock = null; } catch (e) { }
    }
    res.send("<body style='background:#0b141a;color:white;text-align:center;padding-top:100px;'><h3>System Resetting...</h3><script>setTimeout(()=>window.location.href='/', 3000)</script></body>");
    await delay(2000);
    start();
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
        const authPath = path.join(__dirname, 'auth_info');
        const { state, saveCreds } = await useMultiFileAuthState(authPath);

        sock = makeWASocket({
            version,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
            },
            logger: pino({ level: "silent" }),
            printQRInTerminal: true, // Sekarang saya aktifkan juga di terminal agar kamu bisa cross-check
            browser: ["Mac OS", "Chrome", "10.15.7"], // Menggunakan browser yang lebih umum agar cepat kirim QR
            getMessage: async (key) => { return { conversation: undefined } }
        });

        sock.ev.on("creds.update", saveCreds);

        sock.ev.on('call', async (node) => {
            for (const call of node) {
                if (call.status === 'offer') {
                    const callerId = call.from.split('@')[0];
                    addLog(callerId, "📞 Telepon Ditolak");
                    try { await sock.rejectCall(call.id, call.from); } catch (e) { }
                }
            }
        });

        sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log("👉 QR Code Berhasil Dihasilkan!");
                qrCodeData = await QRCode.toDataURL(qr);
            }

            if (connection === "close") {
                isConnected = false;
                qrCodeData = "";
                isStarting = false;
                const reason = lastDisconnect?.error?.output?.statusCode;
                
                if (reason === DisconnectReason.loggedOut) {
                    console.log("❌ Sesi Logout. Menghapus folder auth_info...");
                    if (fs.existsSync(authPath)) fs.rmSync(authPath, { recursive: true, force: true });
                }
                
                console.log(`📡 Koneksi Tutup (${reason}). Restarting...`);
                setTimeout(start, 5000);
            } else if (connection === "open") {
                qrCodeData = ""; 
                isConnected = true;
                isStarting = false;
                console.log("🎊 Bot Online!");
                await delay(2000);
                initQuizScheduler(sock, kuisAktif);
                initJadwalBesokScheduler(sock);
                initSmartFeedbackScheduler(sock, kuisAktif); 
            }
        });

        sock.ev.on("messages.upsert", async (m) => {
            if (m.type === 'notify') {
                const msg = m.messages[0];
                if (!msg.message) return;
                const from = msg.pushName || msg.key.remoteJid.split('@')[0];
                const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "[Media]";
                if (!msg.key.fromMe) addLog(from, text);
                try {
                    await handleMessages(sock, m, kuisAktif, { getWeekDates });
                } catch (err) { }
            }
        });

    } catch (err) {
        console.error("CRITICAL ERROR:", err);
        isStarting = false;
        setTimeout(start, 5000);
    }
}

start();
              
