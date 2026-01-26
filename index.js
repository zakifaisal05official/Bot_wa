const { default: makeWASocket, useMultiFileAuthState, delay, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const QRCode = require("qrcode");
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
let qrCodeData = "";

// ================= CONFIG & DATA =================
const ADMIN_RAW = ['6289531549103', '6285158738155']; // Nomor admin
const DATA_FILE = './data.json';
const NOMOR_PENGURUS = '089531549103';

function readData() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify({ senin: "", selasa: "", rabu: "", kamis: "", jumat: "" }, null, 2));
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function getWeekDates() {
    const now = new Date();
    const dayOfWeek = now.getDay(); 
    const diffToMonday = (dayOfWeek === 0 ? 1 : 1 - dayOfWeek);
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    const dates = [];
    for (let i = 0; i < 5; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        dates.push(`${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`);
    }
    return { dates, periode: `${dates[0]} - ${dates[4]}` };
}

// ================= WEB SERVER QR =================
app.get("/", async (req, res) => {
    if (qrCodeData) {
        res.send(`<html><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#25d366;font-family:sans-serif;"><div style="background:white;padding:20px;border-radius:15px;"><h2>Scan QR Bot WhatsApp</h2><img src="${qrCodeData}" style="width:300px;height:300px;"/><p>Refresh jika QR tidak muncul</p></div></body></html>`);
    } else {
        res.send("<h2>Bot sudah terhubung atau sedang memuat...</h2>");
    }
});
app.listen(port, () => console.log(`Server jalan di port ${port}`));

// ================= BOT CORE =================
async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('session_web_qr');
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        browser: ["Chrome (Linux)", "Chrome", "110.0.0"]
    });

    sock.ev.on("creds.update", saveCreds);

    // --- HANDLER PESAN MASUK ---
    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
        const isAdmin = ADMIN_RAW.some(admin => sender.includes(admin));
        
        // Auto Read & Typing
        await sock.readMessages([msg.key]);
        
        const db = readData();
        const { dates, periode } = getWeekDates();
        const formatRekap = () => `📌 *Daftar List Tugas PR Minggu Ini* 📢\n➝ ${periode}\n\n------------------------------------------------\n\n*📅 Senin* ➝ ${dates[0]}\n${db.senin || '➝ (Tidak ada PR)\n╰┈➤ 👍'}\n\n*📅 Selasa* ➝ ${dates[1]}\n${db.selasa || '➝ (Tidak ada PR)\n╰┈➤ 👍'}\n\n*📅 Rabu* ➝ ${dates[2]}\n${db.rabu || '➝ (Tidak ada PR)\n╰┈➤ 👍'}\n\n*📅 Kamis* ➝ ${dates[3]}\n${db.kamis || '➝ (Tidak ada PR)\n╰┈➤ 👍'}\n\n*📅 Jumat* ➝ ${dates[4]}\n${db.jumat || '➝ (Tidak ada PR)\n╰┈➤ 👍'}\n\n------------------------------------------------\n\n*semangat mengerjakan tugasnya! 🚀*`;

        const args = body.split(' ');
        const cmd = args[0].toLowerCase();

        if (cmd === '!p') {
            await sock.sendPresenceUpdate('composing', sender);
            await sock.sendMessage(sender, { text: '✅ *Bot Aktif!*' });
        } 
        else if (cmd === '!pr') {
            await sock.sendPresenceUpdate('composing', sender);
            await sock.sendMessage(sender, { text: formatRekap() });
        }
        else if (cmd === '!menu') {
            await sock.sendMessage(sender, { text: `📖 *Menu Bot*\n\n🔹 !p ➜ Cek Status\n🔹 !pr ➜ Rekap Tugas\n\n⚙️ *Admin:* !update [hari] [isi], !hapus [hari]` });
        }
        else if (cmd === '!update' && isAdmin) {
            const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
            let day = days.find(d => body.toLowerCase().includes(d));
            if (!day) return await sock.sendMessage(sender, { text: '⚠️ Contoh: !update senin PR MTK' });
            db[day] = body.split(day)[1]?.trim();
            fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
            await sock.sendMessage(sender, { text: `✅ Berhasil update hari ${day}!` });
        }
    });

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            qrCodeData = await QRCode.toDataURL(qr);
        }
        if (connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) start();
        } else if (connection === "open") {
            qrCodeData = "";
            console.log("🎊 BOT TERHUBUNG & SIAP MEMBALAS!");
        }
    });
}

start();
