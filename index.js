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

// --- FIX EBUSY: Fungsi pembersihan sesi yang aman ---
const clearAuthSession = () => {
    const sessionDir = path.join(__dirname, 'auth_info');
    if (fs.existsSync(sessionDir)) {
        try {
            // Gunakan rmSync dengan recursive dan force
            fs.rmSync(sessionDir, { recursive: true, force: true });
            console.log("Sesi lama berhasil dibersihkan secara aman.");
        } catch (err) {
            console.error("Gagal membersihkan sesi (EBUSY):", err.message);
            // Jika EBUSY di Railway, biarkan saja nanti process.exit yang selesaikan
        }
    }
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
            body { background: #0b141a; color: #e9edef; font-family: sans-serif; }
            .card { background: #222e35; border: none; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
            .status-dot { height: 12px; width: 12px; background-color: #25d366; border-radius: 50%; display: inline-block; margin-right: 8px; box-shadow: 0 0 10px #25d366; animation: pulse 1.5s infinite; }
            @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
            .log-container { background: #0b141a; border-radius: 8px; height: 300px; overflow-y: auto; padding: 10px; border: 1px solid #2a3942; }
            .log-item { border-bottom: 1px solid #2a3942; padding: 8px 0; font-size: 0.85rem; }
            .qr-container { background: white; padding: 15px; border-radius: 10px; display: inline-block; }
        </style>
    `;

    if (isConnected) {
        return res.send(`
            <html><head><title>Monitor Online</title>${commonHead}</head>
            <body class="py-5"><div class="container" style="max-width: 500px;">
                <div class="card p-4 text-center">
                    <div class="d-flex align-items-center justify-content-between mb-3">
                        <div class="d-flex align-items-center"><span class="status-dot"></span><h4 class="mb-0">Bot Online</h4></div>
                        <a href="/restart" class="btn btn-outline-danger btn-sm">Restart</a>
                    </div>
                    <div class="bg-dark p-2 rounded mb-3 text-start small">
                        RAM: ${usedRAM}/${totalRAM} GB | Up: ${uptime} Jam
                    </div>
                    <div class="log-container text-start">
                        ${messageLogs.map(l => `<div class="log-item"><strong>${l.sender}:</strong> ${l.text}</div>`).join('') || 'Menunggu pesan...'}
                    </div>
                    <button class="btn btn-success w-100 mt-3" onclick="location.reload()">Refresh</button>
                </div>
            </div></body></html>
        `);
    }

    if (qrCodeData) {
        return res.send(`
            <html><head><title>Scan QR</title>${commonHead}</head>
            <body class="d-flex align-items-center justify-content-center vh-100">
                <div class="card p-4 text-center">
                    <h5 class="mb-3">Hubungkan WhatsApp</h5>
                    <div class="qr-container mb-3"><img src="${qrCodeData}" class="img-fluid"/></div>
                    <p class="small text-secondary">Buka WhatsApp > Perangkat Tertaut > Scan QR ini</p>
                    <script>setTimeout(() => { location.reload(); }, 15000);</script>
                </div>
            </body></html>
        `);
    }

    res.send(`<html><head>${commonHead}</head><body style="background:#0b141a;color:white;text-align:center;padding-top:150px;">
        <div class="spinner-border text-success mb-3"></div><h3>BOOTING SYSTEM...</h3><script>setTimeout(()=>location.reload(), 3000);</script>
    </body></html>`);
});

app.get("/restart", (req, res) => {
    res.send("Restarting... <script>setTimeout(()=>window.location.href='/', 5000);</script>");
    // Exit dengan delay agar response terkirim ke browser dulu
    setTimeout(() => { process.exit(0); }, 1000);
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
            browser: ["Mac OS", "Chrome", "10.15.7"], 
            getMessage: async (key) => { return { conversation: undefined } }
        });

        sock.ev.on("creds.update", saveCreds);

        // Anti-Call Otomatis
        sock.ev.on('call', async (node) => {
            for (const call of node) {
                if (call.status === 'offer') {
                    const callerId = call.from.split('@')[0];
                    addLog(callerId, "📞 Telepon Ditolak Otomatis");
                    await sock.rejectCall(call.id, call.from);
                    await sock.sendMessage(call.from, { text: "⚠️ *BOT TIDAK MENERIMA PANGGILAN*" });
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
                
                console.log(`📡 Koneksi Tutup: ${reason}`);
                
                if (reason === DisconnectReason.loggedOut) {
                    console.log("❌ Sesi Keluar. Menghapus data login...");
                    clearAuthSession();
                    // Jika logout, kita paksa exit agar Railway deploy ulang tanpa lock file
                    process.exit(1);
                } else {
                    setTimeout(start, 5000);
                }
            } else if (connection === "open") {
                qrCodeData = ""; 
                isConnected = true;
                isStarting = false;
                console.log("🎊 [BERHASIL] Bot Online!");
                
                await delay(3000); 
                try {
                    initQuizScheduler(sock, kuisAktif);
                    initJadwalBesokScheduler(sock);
                    initSmartFeedbackScheduler(sock, kuisAktif); 
                } catch (e) {
                    console.error("Gagal inisialisasi scheduler:", e.message);
                }
            }
        });

        sock.ev.on("messages.upsert", async (m) => {
            if (m.type === 'notify') {
                const msg = m.messages[0];
                if (!msg.message || msg.key.fromMe) return;

                const from = msg.pushName || msg.key.remoteJid.split('@')[0];
                const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "[Media]";
                
                addLog(from, text);

                try {
                    await handleMessages(sock, m, kuisAktif, { getWeekDates });
                } catch (err) {
                    console.error("❌ Error Message Handler:", err.message);
                }
            }
        });

    } catch (err) {
        console.error("❌ ERROR UTAMA:", err.message);
        isStarting = false;
        setTimeout(start, 5000);
    }
}

start();                 
