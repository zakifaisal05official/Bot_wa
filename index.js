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
const path = require("path");
const fs = require("fs");

const { handleMessages } = require('./handler'); 
const { 
    initQuizScheduler, 
    initJadwalBesokScheduler, 
    initSmartFeedbackScheduler, 
    initListPrMingguanScheduler, 
    initSahurScheduler,
    getWeekDates, 
    sendJadwalBesokManual 
} = require('./scheduler'); 
const { renderDashboard } = require('./views/dashboard'); 
// TAMBAHAN: Import view khusus media
const { renderMediaView } = require('./views/mediaView'); 

// --- DYNAMIC VOLUME PATH ---
const VOLUME_PATH = '/app/auth_info';
// Perubahan kecil: Pakai ridfot sesuai identitasmu
const CONFIG_PATH = path.join(VOLUME_PATH, 'config.ridfot'); 
// Path folder foto
const PUBLIC_FILES_PATH = path.join(VOLUME_PATH, 'public_files');

// Pastikan folder volume dan folder publik ada
if (!fs.existsSync(VOLUME_PATH)) {
    fs.mkdirSync(VOLUME_PATH, { recursive: true });
}
if (!fs.existsSync(PUBLIC_FILES_PATH)) {
    fs.mkdirSync(PUBLIC_FILES_PATH, { recursive: true });
}

// --- FUNGSI AUTO CLEANING (MENGHAPUS FILE > 7 HARI) ---
const cleanOldFiles = () => {
    const MAX_AGE_DAYS = 7;
    const now = Date.now();
    if (fs.existsSync(PUBLIC_FILES_PATH)) {
        const files = fs.readdirSync(PUBLIC_FILES_PATH);
        files.forEach(file => {
            const filePath = path.join(PUBLIC_FILES_PATH, file);
            const stats = fs.statSync(filePath);
            const fileAgeMs = now - stats.mtimeMs;
            const maxAgeMs = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
            if (fileAgeMs > maxAgeMs) {
                fs.unlinkSync(filePath);
            }
        });
    }
};
// Jalankan setiap 24 jam
setInterval(cleanOldFiles, 24 * 60 * 60 * 1000);
cleanOldFiles(); 

// Default config: Pastikan semua fitur terdaftar di sini
let botConfig = { 
    quiz: true, 
    jadwalBesok: true, 
    smartFeedback: true, 
    prMingguan: true, 
    sahur: true 
};

// Fungsi Load Config: Mengambil data dari volume agar status tidak reset
function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
            const parsed = JSON.parse(data);
            // Gabungkan data lama dengan default agar fitur baru muncul
            Object.assign(botConfig, parsed);
            console.log("✅ Config Berhasil Dimuat dari Volume");
        } else {
            // Jika file belum ada, buat file baru
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(botConfig, null, 2));
        }
    } catch (e) { 
        console.error("❌ Gagal memuat config:", e.message); 
    }
}
loadConfig();

const saveConfig = () => {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(botConfig, null, 2));
    } catch (e) { console.error("❌ Gagal menyimpan config"); }
};

const app = express();
const port = process.env.PORT || 8080;
let qrCodeData = "", isConnected = false, sock, logs = [], stats = { pesanMasuk: 0, totalLog: 0 };

// --- CONFIGURASI STATIC FILE & MEDIA ROUTE ---
app.use('/files', express.static(PUBLIC_FILES_PATH));

// UPDATE: Rute untuk mendukung multi-file (Slider)
app.get("/tugas/:filenames", (req, res) => {
    const filenames = req.params.filenames.split(','); 
    const fileUrls = filenames.map(name => `/files/${name}`); 
    res.setHeader('Content-Type', 'text/html');
    res.send(renderMediaView(fileUrls));
});

const addLog = (msg) => {
    const time = new Date().toLocaleTimeString('id-ID');
    logs.unshift(`<span style="color: #00ff73;">[${time}]</span> <span style="color: #ffffff !important;">${msg}</span>`);
    stats.totalLog++;
    if (logs.length > 50) logs.pop();
};

app.get("/toggle/:feature", (req, res) => {
    const feat = req.params.feature;
    if (botConfig.hasOwnProperty(feat)) {
        botConfig[feat] = !botConfig[feat];
        saveConfig();
        const status = botConfig[feat] ? 'ON' : 'OFF';
        addLog(`Sistem ${feat} diubah -> ${status}`);
    }
    res.redirect("/");
});

app.get("/", (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(renderDashboard(isConnected, qrCodeData, botConfig, stats, logs, port));
});

// --- PERUBAHAN: Jalankan listen di atas agar Zeabur mendeteksi servis aktif ---
app.listen(port, "0.0.0.0", () => {
    console.log(`✅ Web Dashboard aktif di port ${port}`);
});

async function start() {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState(VOLUME_PATH);

    sock = makeWASocket({
        version,
        auth: { 
            creds: state.creds, 
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })) 
        },
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: ["Syteam-Bot", "Chrome", "1.0.0"],
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) qrCodeData = await QRCode.toDataURL(qr);
        
        if (connection === "close") {
            isConnected = false;
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                addLog("Reconnecting...");
                setTimeout(start, 5000);
            }
        } else if (connection === "open") {
            isConnected = true; 
            qrCodeData = "";
            addLog("Bot Terhubung ke WhatsApp!");
            
            initQuizScheduler(sock, botConfig); 
            initJadwalBesokScheduler(sock, botConfig);
            initSmartFeedbackScheduler(sock, botConfig);
            initListPrMingguanScheduler(sock, botConfig);
            initSahurScheduler(sock, botConfig);
        }
    });

    sock.ev.on("messages.upsert", async (m) => {
        if (m.type === 'notify') {
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe) return;
            stats.pesanMasuk++;
            addLog(`Pesan dari: ${msg.pushName || 'User'}`);
            await handleMessages(sock, m, botConfig, { getWeekDates, sendJadwalBesokManual });
        }
    });
}

// Jalankan bot setelah server web siap
start();
