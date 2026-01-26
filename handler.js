const db = require('./data');
const { delay } = require("@whiskeysockets/baileys");
const fs = require('fs');

// ================= CONFIG =================
const ADMIN_RAW = ['6289531549103', '171425214255294', '6285158738155']; 
const NOMOR_PENGURUS = '089531549103';
const ID_GRUP_TUJUAN = '120363403625197368@g.us'; 

// ================= UTIL: AUTO DATE LOGIC =================
function getWeekDates() {
    const now = new Date();
    const dayOfWeek = now.getDay(); 
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    
    const dates = [];
    for (let i = 0; i < 5; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        dates.push(`${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`);
    }
    const periode = `${dates[0]} - ${dates[4]}`;
    return { dates, periode };
}

async function handleMessages(sock, m) {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const sender = msg.key.remoteJid;
    const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
    
    // --- EDUKASI FORMAT (Sama seperti kode lama) ---
    const textLower = body.toLowerCase();
    const triggers = ['p', 'pr', 'menu', 'update', 'hapus', 'grup', 'info'];
    if (!body.startsWith('!') && triggers.includes(textLower)) {
        const pesanArahkan = `⚠️ *Format Salah!*\n\nUntuk menggunakan bot, kamu harus menggunakan tanda seru (*!*) di depan perintah.\n\n💡 Contoh: Ketik *!menu* untuk melihat bantuan.`;
        return await sock.sendMessage(sender, { text: pesanArahkan });
    }

    if (!body.startsWith('!')) return;

    const isAdmin = ADMIN_RAW.some(admin => sender.includes(admin));
    const args = body.split(' ');
    const cmd = args[0].toLowerCase();
    const currentData = db.getAll();
    const { dates, periode } = getWeekDates();

    // Fungsi Format Rekap (Sesuai Screenshot & Kode Lama)
    const formatRekap = () => {
        let rekap = `📌 *Daftar List Tugas PR Minggu Ini* 📢\n➝ ${periode}\n\n`;
        rekap += `_________________________________\n\n`;
        
        const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
        const dayLabels = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

        days.forEach((day, i) => {
            rekap += `📅 *${dayLabels[i]}* ➝ ${dates[i]}\n`;
            if (currentData[day] === "Belum ada tugas." || !currentData[day] || currentData[day] === "") {
                rekap += `➝ (Tidak ada PR)\n╰───➤ 👍\n\n`;
            } else {
                rekap += `➝ ${currentData[day]}\n\n`;
            }
        });
        
        rekap += `_________________________________\n\n`;
        rekap += `*semangat menyelesaikan semua tugasnya! 🚀*`;
        return rekap;
    };

    await sock.readMessages([msg.key]);

    try {
        // --- 1. FITUR UMUM ---
        if (cmd === '!p') {
            return await sock.sendMessage(sender, { text: '✅ *Bot Aktif!*' });
        } 
        
        else if (cmd === '!pr') {
            await sock.sendPresenceUpdate('composing', sender);
            await delay(1500);
            return await sock.sendMessage(sender, { text: formatRekap() });
        }

        else if (cmd === '!menu') {
            const menu = `📖 *Daftar Perintah Bot*\n\n🔹 !p ➜ Cek Status\n🔹 !pr ➜ Rekap PR (Japri)\n\n⚙️ *Khusus Pengurus List Tugas:*\n🔸 !grup ➜ Kirim Rekap ke Grup\n🔸 !info [pesan] ➜ Pengumuman Baru\n🔸 !update [hari] [isi] ➜ Update PR\n🔸 !hapus [hari] ➜ Kosongkan tugas`;
            return await sock.sendMessage(sender, { text: menu });
        }

        // --- 2. LOGIKA ADMIN (KIRIM KE GRUP) ---
        const adminCommands = ['!grup', '!update', '!hapus', '!info'];
        if (adminCommands.includes(cmd)) {
            if (!isAdmin) {
                return await sock.sendMessage(sender, { text: `🚫 *Akses Ditolak!*\n\nFitur ini hanya untuk *Pengurus List Tugas*.\n\n💡 Hubungi: *${NOMOR_PENGURUS}*` });
            }

            if (cmd === '!info') {
                const pesanInfo = body.replace(/!info/i, '').trim();
                if (!pesanInfo) return await sock.sendMessage(sender, { text: '⚠️ *Isi Infonya!*' });

                const pengumuman = `📢 *PENGUMUMAN INFO BARU* 📢\n\n${pesanInfo}\n\n_________________________________\n_Info dari: Pengurus List Tugas_`;
                await sock.sendMessage(ID_GRUP_TUJUAN, { text: pengumuman });
                return await sock.sendMessage(sender, { text: '✅ Info telah dikirim ke grup.' });
            }

            if (cmd === '!grup') {
                return await sock.sendMessage(ID_GRUP_TUJUAN, { text: formatRekap() });
            }

            if (cmd === '!update') {
                const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
                let targetDay = days.find(day => body.toLowerCase().includes(day));
                if (!targetDay) return await sock.sendMessage(sender, { text: '⚠️ *Format Salah!* (Pilih Senin-Jumat)' });

                const content = body.split(targetDay)[1]?.trim();
                if (!content) return await sock.sendMessage(sender, { text: '⚠️ *Isi tugasnya!*' });

                db.updateTugas(targetDay, content);

                const updateMsg = `📢 *UPDATE TUGAS PR: ${targetDay.toUpperCase()}*\n\n${content}\n\n_Cek list lengkap ketik *!pr*_`;
                await sock.sendMessage(ID_GRUP_TUJUAN, { text: updateMsg });
                return await sock.sendMessage(sender, { text: `✅ *Update Berhasil!*` });
            }

            if (cmd === '!hapus') {
                const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
                let targetDay = days.find(day => body.toLowerCase().includes(day));
                if (!targetDay) return await sock.sendMessage(sender, { text: '⚠️ *Pilih hari!*' });
                
                db.resetHari(targetDay);
                return await sock.sendMessage(sender, { text: `✅ *Dikosongkan!*` });
            }
        }
    } catch (err) {
        console.error(err);
    }
}

module.exports = { handleMessages };
