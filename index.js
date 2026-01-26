const { default: makeWASocket, useMultiFileAuthState, delay, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require('fs');

// ================= CONFIG =================
const ADMIN_RAW = ['6289531549103', '171425214255294', '6285158738155']; 
const DATA_FILE = './data.json';
const NOMOR_PENGURUS = '089531549103';

// Fungsi Baca/Tulis Data Tugas
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

async function start() {
    // Gunakan folder session yang sudah berhasil login tadi
    const { state, saveCreds } = await useMultiFileAuthState('session_web_qr');
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: true,
        browser: ["Ubuntu", "Chrome", "110.0"]
    });

    sock.ev.on("creds.update", saveCreds);

    // Handler Pesan Masuk
    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
        
        // AUTO READ & TYPING EFFECT
        await sock.readMessages([msg.key]);
        await sock.sendPresenceUpdate('composing', sender);
        await delay(1500); // Simulasi ngetik 1.5 detik

        const isAdmin = ADMIN_RAW.some(admin => sender.includes(admin));
        const db = readData();
        const { dates, periode } = getWeekDates();
        
        const formatRekap = () => `📌 *Daftar List Tugas PR Minggu Ini* 📢\n➝ ${periode}\n\n------------------------------------------------\n\n*📅 Senin* ➝ ${dates[0]}\n${db.senin || '➝ (Tidak ada PR)\n╰┈➤ 👍'}\n\n*📅 Selasa* ➝ ${dates[1]}\n${db.selasa || '➝ (Tidak ada PR)\n╰┈➤ 👍'}\n\n*📅 Rabu* ➝ ${dates[2]}\n${db.rabu || '➝ (Tidak ada PR)\n╰┈➤ 👍'}\n\n*📅 Kamis* ➝ ${dates[3]}\n${db.kamis || '➝ (Tidak ada PR)\n╰┈➤ 👍'}\n\n*📅 Jumat* ➝ ${dates[4]}\n${db.jumat || '➝ (Tidak ada PR)\n╰┈➤ 👍'}\n\n------------------------------------------------\n\n*semangat mengerjakan tugasnya! 🚀*`;

        const args = body.split(' ');
        const cmd = args[0].toLowerCase();

        // LOGIKA PERINTAH
        if (cmd === '!p') {
            await sock.sendMessage(sender, { text: '✅ *Bot Tugas Aktif!*' });
        } 
        else if (cmd === '!pr') {
            await sock.sendMessage(sender, { text: formatRekap() });
        }
        else if (cmd === '!menu') {
            const menu = `📖 *Menu Bot*\n\n🔹 !p ➜ Cek Status\n🔹 !pr ➜ Rekap Tugas\n\n⚙️ *Admin:* !update, !hapus, !info`;
            await sock.sendMessage(sender, { text: menu });
        }
        else if (cmd === '!update' && isAdmin) {
            const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
            let day = days.find(d => body.toLowerCase().includes(d));
            if (!day) return await sock.sendMessage(sender, { text: '⚠️ Gunakan: !update [hari] [isi]' });
            
            db[day] = body.split(day)[1]?.trim();
            fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
            await sock.sendMessage(sender, { text: `✅ Berhasil update tugas hari ${day}!` });
        }

        await sock.sendPresenceUpdate('paused', sender);
    });

    sock.ev.on("connection.update", (update) => {
        const { connection } = update;
        if (connection === "open") console.log("🎊 BOT SUDAH AKTIF!");
        if (connection === "close") start();
    });
}

start();
