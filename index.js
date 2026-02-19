const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, delay } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");

// --- IMPORT MODULAR ---
const { handleMessages } = require('./handler'); 
const { initQuizScheduler, initJadwalBesokScheduler, initSmartFeedbackScheduler, initListPrMingguanScheduler, getWeekDates, sendJadwalBesokManual } = require('./scheduler'); 
const { renderDashboard } = require('./views/dashboard'); // Import tampilan

const CONFIG_PATH = path.join(__dirname, 'config.json');
let botConfig = { quiz: true, jadwalBesok: true, smartFeedback: true, prMingguan: true };

if (fs.existsSync(CONFIG_PATH)) {
    try { botConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')); } catch (e) { console.error("Config error"); }
}

const saveConfig = () => fs.writeFileSync(CONFIG_PATH, JSON.stringify(botConfig, null, 2));

const KUIS_PATH = './kuis.json';
let kuisAktif = { msgId: null, data: null, votes: {}, targetJam: null, tglID: null, expiresAt: null };
if (fs.existsSync(KUIS_PATH)) {
    try {
        const savedKuis = JSON.parse(fs.readFileSync(KUIS_PATH, 'utf-8'));
        const now = new Date();
        if (savedKuis.tglID === `${now.getDate()}-${now.getMonth()}`) kuisAktif = savedKuis;
    } catch (e) {}
}

const app = express();
const port = process.env.PORT || 8080;
let qrCodeData = ""; 
let isConnected = false; 
let sock; 
let logs = [];
let stats = { pesanMasuk: 0, totalLog: 0 };

const addLog = (msg) => {
    logs.unshift(`<span style="color: #0d6efd;">[${new Date().toLocaleTimeString('id-ID')}]</span> ${msg}`);
    stats.totalLog++;
    if (logs.length > 50) logs.pop();
};

app.get("/toggle/:feature", (req, res) => {
    const feat = req.params.feature;
    if (botConfig.hasOwnProperty(feat)) {
        botConfig[feat] = !botConfig[feat];
        saveConfig();
        addLog(`${feat} changed to ${botConfig[feat] ? 'ON' : 'OFF'}`);
    }
    res.redirect("/");
});

app.get("/", (req, res) => {
    // Memanggil fungsi render dari file dashboard.js
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
            addLog("Bot Connected!");
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
            addLog(`New msg from: ${msg.pushName || 'User'}`);
            await handleMessages(sock, m, kuisAktif, { getWeekDates, sendJadwalBesokManual });
        }
    });
}

start();
app.listen(port, "0.0.0.0", () => console.log(`Server on port ${port}`));
         
