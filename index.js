const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, delay } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");

const { handleMessages } = require('./handler'); 
const { initQuizScheduler, initJadwalBesokScheduler, initSmartFeedbackScheduler, initListPrMingguanScheduler, getWeekDates, sendJadwalBesokManual } = require('./scheduler'); 
const { renderDashboard } = require('./views/dashboard'); 

// --- FIXED CONFIG SYSTEM ---
const CONFIG_PATH = path.join(__dirname, 'config.json');
let botConfig = { quiz: true, jadwalBesok: true, smartFeedback: true, prMingguan: true };

function loadConfig() {
    if (fs.existsSync(CONFIG_PATH)) {
        try {
            const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
            botConfig = JSON.parse(data);
            console.log("✅ Config Loaded:", botConfig);
        } catch (e) { console.error("Gagal load config"); }
    }
}
loadConfig(); // Load di awal sebelum start

const saveConfig = () => fs.writeFileSync(CONFIG_PATH, JSON.stringify(botConfig, null, 2));

// --- KUIS DATABASE ---
const KUIS_PATH = './kuis.json';
let kuisAktif = { msgId: null, data: null, votes: {}, targetJam: null, tglID: null, expiresAt: null };

const app = express();
const port = process.env.PORT || 8080;
let qrCodeData = "", isConnected = false, sock, logs = [], stats = { pesanMasuk: 0, totalLog: 0 };

const addLog = (msg) => {
    logs.unshift(`<span style="color: #00ff73;">[${new Date().toLocaleTimeString('id-ID')}]</span> ${msg}`);
    stats.totalLog++;
    if (logs.length > 50) logs.pop();
};

app.get("/toggle/:feature", (req, res) => {
    const feat = req.params.feature;
    if (botConfig.hasOwnProperty(feat)) {
        botConfig[feat] = !botConfig[feat];
        saveConfig();
        addLog(`Fitur ${feat} -> ${botConfig[feat] ? 'ON' : 'OFF'}`);
    }
    res.redirect("/");
});

app.get("/", (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(renderDashboard(isConnected, qrCodeData, botConfig, stats, logs, port));
});

async function start() {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'auth_info'));

    sock = makeWASocket({
        version,
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })) },
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: ["Ubuntu", "Chrome", "20.0.0.4"],
    });

    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) qrCodeData = await QRCode.toDataURL(qr);
        if (connection === "close") {
            isConnected = false;
            if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) setTimeout(start, 5000);
        } else if (connection === "open") {
            isConnected = true; qrCodeData = "";
            addLog("Bot Online!");
            // Jalankan scheduler HANYA jika status di botConfig adalah true
            if (botConfig.quiz) initQuizScheduler(sock, kuisAktif);
            if (botConfig.jadwalBesok) initJadwalBesokScheduler(sock);
            if (botConfig.smartFeedback) initSmartFeedbackScheduler(sock, kuisAktif);
            if (botConfig.prMingguan) initListPrMingguanScheduler(sock);
        }
    });

    sock.ev.on("messages.upsert", async (m) => {
        if (m.type === 'notify') {
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe) return;
            stats.pesanMasuk++;
            addLog(`Chat: ${msg.pushName || 'User'}`);
            await handleMessages(sock, m, kuisAktif, { getWeekDates, sendJadwalBesokManual });
        }
    });
}

start();
app.listen(port, "0.0.0.0");
    
