const { askAI } = require('./ai_handler');
const { handleUserCommands } = require('./features/userHandler');
const { handleAdminCommands } = require('./features/adminHandler');
const fs = require('fs');

const ADMIN_RAW = ['6289531549103', '171425214255294', '6285158738155' , '241849843351688' , '254326740103190' , '8474121494667']; 

function getClosestCommand(cmd) {
    const validCommands = ['!p', '!pr', '!deadline', '!menu', '!update', '!update_jadwal', '!hapus', '!grup', '!polling', '!info', '!reset-bot', '!polling_kirim', '!data', '!cek_db', '!jadwal_baru'];
    if (validCommands.includes(cmd)) return null;
    return validCommands.find(v => {
        const distance = Math.abs(v.length - cmd.length);
        return distance <= 1 && (v.startsWith(cmd.substring(0, 2)) || cmd.startsWith(v.substring(0, 2)));
    });
}

async function handleMessages(sock, m, botConfig, utils) {
    try {
        const msg = m.messages[0];
        if (!msg || !msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || msg.message.documentMessage?.caption || "").trim();
        if (!body) return;

        const textLower = body.toLowerCase();
        const isAdmin = ADMIN_RAW.some(admin => sender.includes(admin));
        const nonAdminMsg = "🚫 *AKSES DITOLAK*\n\nMaaf, fitur ini hanya bisa diakses oleh *Pengurus*. Kamu adalah pengguna biasa, silakan gunakan fitur pengguna seperti *!pr* atau *!deadline* saja ya! 😊";

        // Logika AI
        if (textLower.includes('asisten')) {
            await sock.sendPresenceUpdate('composing', sender);
            const response = await askAI(body);
            return await sock.sendMessage(sender, { text: response }, { quoted: msg });
        }

        // Check Format Tanpa Tanda Seru
        const triggers = ['p', 'pr', 'menu', 'update', 'update_jadwal', 'hapus', 'grup', 'info', 'deadline', 'polling', 'polling_kirim', 'data', 'cek_db', 'jadwal_baru'];
        const firstWord = textLower.split(' ')[0].replace('!', '');
        if (!body.startsWith('!') && triggers.includes(firstWord)) {
            return await sock.sendMessage(sender, { text: `⚠️ *Format Salah!*\n\nGunakan tanda seru (*!*) di depan perintah.\n💡 Contoh: *!menu*` });
        }

        if (!body.startsWith('!')) return;

        const args = body.split(' ');
        const cmd = args[0].toLowerCase();

        // Menu
        if (cmd === '!menu') {
            const menu = `📖 *MENU BOT TUGAS*\n\n*PENGGUNA:* \n🔹 !p - Cek Aktif\n🔹 !pr - List Tugas\n🔹 !deadline - Daftar Belum Dikumpul\n\n*PENGURUS:* \n🔸 !update [hari] [tugas]\n🔸 !update_jadwal [hari] [tugas]\n🔸 !jadwal_baru (Sync Jadwal)\n🔸 !deadline [isi info]\n🔸 !cek_db [cek database]\n🔸 !hapus [hari/deadline]\n🔸 !grup (Kirim rekap ke grup)\n🔸 !data (Kirim Jadwal Besok ke grup)\n🔸 !polling [soal] | [opsi:feedback]\n🔸 !polling_kirim [hari]\n🔸 !info [pesan]`;
            return await sock.sendMessage(sender, { text: menu });
        }

        // Suggestion
        const suggestion = getClosestCommand(cmd);
        if (suggestion) return await sock.sendMessage(sender, { text: `🧐 *Perintah tidak dikenal.*\n\nMungkin maksud Anda: *${suggestion}* ?\nKetik *!menu* untuk melihat semua perintah.` });

        // Routing
        const userCmds = ['!p', '!pr', '!deadline'];
        const adminCmds = ['!update', '!update_jadwal', '!hapus', '!grup', '!info', '!reset-bot', '!data', '!cek_db', '!jadwal_baru'];

        if (userCmds.includes(cmd)) {
            await handleUserCommands(sock, msg, cmd, args, utils);
        } else if (adminCmds.includes(cmd)) {
            if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
            await handleAdminCommands(sock, msg, cmd, args, utils, body, nonAdminMsg);
        }

    } catch (err) { console.error("Error Main Handler:", err); }
}

module.exports = { handleMessages };
