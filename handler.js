const { askAI } = require('./ai_handler');
const { handleUserCommands } = require('./features/userHandler');
const { handleAdminCommands } = require('./features/adminHandler');
const fs = require('fs');

// Daftar ID Admin
const ADMIN_RAW = ['6289531549103', '171425214255294', '6285158738155' , '241849843351688' , '254326740103190' , '8474121494667']; 

function getClosestCommand(cmd) {
    // Daftar perintah baru & pemetaan perintah lama ke baru
    const commandsMap = {
        '!menu': '!bantuan',
        '!p': '!cekbot',
        '!pr': '!list_pr',
        '!deadline': '!tugas_lama'
    };

    // Jika user ketik perintah lama, langsung sarankan yang baru
    if (commandsMap[cmd]) return commandsMap[cmd];

    const validCommands = [
        '!cekbot', '!list_pr', '!tugas_lama', '!bantuan', '!jadwal', '!tambah_pr', '!hapus_pr', 
        '!update', '!update_jadwal', '!hapus', '!grup', '!polling', '!info', '!reset-bot', '!data', '!cek_db'
    ];

    if (validCommands.includes(cmd)) return null;

    // Cari yang paling mirip secara teks
    return validCommands.find(v => {
        const distance = Math.abs(v.length - cmd.length);
        return distance <= 2 && (v.startsWith(cmd.substring(0, 3)) || cmd.startsWith(v.substring(0, 3)));
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

        // Logika AI
        if (textLower.includes('asisten')) {
            await sock.sendPresenceUpdate('composing', sender);
            const response = await askAI(body);
            return await sock.sendMessage(sender, { text: response }, { quoted: msg });
        }

        // Check Format Tanpa Tanda Seru
        const triggers = ['cekbot', 'list_pr', 'tugas_lama', 'bantuan', 'jadwal', 'tambah_pr', 'hapus_pr', 'update', 'update_jadwal', 'hapus', 'grup', 'info', 'data', 'menu', 'pr', 'deadline'];
        const firstWord = textLower.split(' ')[0].replace('!', '');
        
        if (!body.startsWith('!') && triggers.includes(firstWord)) {
            return await sock.sendMessage(sender, { text: `⚠️ *Format Salah!*\n\nGunakan tanda seru (*!*) di depan perintah.\n💡 Contoh: *!bantuan*` });
        }

        if (!body.startsWith('!')) return;

        const args = body.split(' ');
        const cmd = args[0].toLowerCase();

        // Routing Perintah User
        const userCmds = ['!cekbot', '!list_pr', '!tugas_lama', '!bantuan', '!jadwal', '!tambah_pr', '!hapus_pr'];
        
        // Routing Perintah Admin
        const adminCmds = ['!update', '!update_jadwal', '!hapus', '!grup', '!info', '!reset-bot', '!data', '!cek_db'];

        if (userCmds.includes(cmd)) {
            await handleUserCommands(sock, msg, cmd, args, utils);
        } else if (adminCmds.includes(cmd)) {
            if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
            await handleAdminCommands(sock, msg, cmd, args, utils, body, nonAdminMsg);
        } else {
            // Logika Suggestion jika perintah tidak muncul atau salah ketik
            const suggestion = getClosestCommand(cmd);
            if (suggestion) {
                const pesanSaran = 
                    `🧐 *PERINTAH TIDAK DIKENAL*\n` +
                    `━━━━━━━━━━━━━━━━━━━━\n` +
                    `Mungkin maksud kamu: *${suggestion}* ?\n\n` +
                    `💡 *Info:* Kami baru saja memperbarui nama perintah agar lebih rapi. Ketik *!bantuan* untuk melihat menu terbaru.`;
                
                return await sock.sendMessage(sender, { text: pesanSaran });
            }
        }

    } catch (err) { 
        console.error("Error Main Handler:", err); 
    }
}

module.exports = { handleMessages };
