const { askAI } = require('./ai_handler');
const { handleUserCommands } = require('./features/userHandler');
const { handleAdminCommands } = require('./features/adminHandler');
const fs = require('fs');

// Daftar ID Admin
const ADMIN_RAW = ['6289531549103', '171425214255294', '6285158738155' , '241849843351688' , '254326740103190' , '8474121494667']; 

function getClosestCommand(cmd) {
    // Daftar command valid yang sudah diperbarui
    const validCommands = [
        '!cekbot', '!list_pr', '!tugas_lama', '!bantuan', '!jadwal', '!tambah_pr', '!hapus_pr', // User & Report
        '!update', '!update_jadwal', '!hapus', '!grup', '!polling', '!info', '!reset-bot', '!data', '!cek_db' // Admin
    ];
    if (validCommands.includes(cmd)) return null;
    return validCommands.find(v => {
        const distance = Math.abs(v.length - cmd.length);
        return distance <= 1 && (v.startsWith(cmd.substring(0, 3)) || cmd.startsWith(v.substring(0, 3)));
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
        const nonAdminMsg = "🚫 *AKSES DITOLAK*\n\nMaaf, fitur ini hanya bisa diakses oleh *Pengurus*. Kamu bisa gunakan fitur siswa seperti *!list_pr* atau *!bantuan* ya! 😊";

        // Logika AI (Trigger kata 'asisten')
        if (textLower.includes('asisten')) {
            await sock.sendPresenceUpdate('composing', sender);
            const response = await askAI(body);
            return await sock.sendMessage(sender, { text: response }, { quoted: msg });
        }

        // Check Format Tanpa Tanda Seru (Sinkronisasi trigger baru)
        const triggers = ['cekbot', 'list_pr', 'tugas_lama', 'bantuan', 'jadwal', 'tambah_pr', 'hapus_pr', 'update', 'update_jadwal', 'hapus', 'grup', 'info', 'data'];
        const firstWord = textLower.split(' ')[0].replace('!', '');
        if (!body.startsWith('!') && triggers.includes(firstWord)) {
            return await sock.sendMessage(sender, { text: `⚠️ *Format Salah!*\n\nGunakan tanda seru (*!*) di depan perintah.\n💡 Contoh: *!bantuan*` });
        }

        if (!body.startsWith('!')) return;

        const args = body.split(' ');
        const cmd = args[0].toLowerCase();

        // Routing Perintah User (Sinkron dengan userHandler terbaru)
        const userCmds = ['!cekbot', '!list_pr', '!tugas_lama', '!bantuan', '!jadwal', '!tambah_pr', '!hapus_pr'];
        
        // Routing Perintah Admin (Fitur Pengurus)
        const adminCmds = ['!update', '!update_jadwal', '!hapus', '!grup', '!info', '!reset-bot', '!data', '!cek_db'];

        if (userCmds.includes(cmd)) {
            // Mengarahkan ke userHandler.js
            await handleUserCommands(sock, msg, cmd, args, utils);
        } else if (adminCmds.includes(cmd)) {
            // Proteksi Admin
            if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
            await handleAdminCommands(sock, msg, cmd, args, utils, body, nonAdminMsg);
        } else {
            // Suggestion jika command typo
            const suggestion = getClosestCommand(cmd);
            if (suggestion) {
                return await sock.sendMessage(sender, { text: `🧐 *Perintah tidak dikenal.*\n\nMungkin maksud kamu: *${suggestion}* ?\nKetik *!bantuan* untuk melihat menu.` });
            }
        }

    } catch (err) { 
        console.error("Error Main Handler:", err); 
    }
}

module.exports = { handleMessages };
