const db = require('./data');
const { delay } = require("@whiskeysockets/baileys");

// ================= CONFIG =================
const ADMIN_RAW = ['6289531549103', '171425214255294', '6285158738155']; 
const NOMOR_PENGURUS = '089531549103';
const ID_GRUP_TUJUAN = '120363403625197368@g.us'; // Pastikan ID ini benar

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
    const textLower = body.toLowerCase();
    
    const triggers = ['p', 'pr', 'menu', 'update', 'hapus', 'grup', 'info'];
    if (!body.startsWith('!') && triggers.includes(textLower)) {
        return await sock.sendMessage(sender, { text: `⚠️ *Format Salah!*\n\nGunakan tanda seru (*!*) di depan perintah.\nContoh: *!menu*` });
    }

    if (!body.startsWith('!')) return;

    const isAdmin = ADMIN_RAW.some(admin => sender.includes(admin));
    const args = body.split(' ');
    const cmd = args[0].toLowerCase();
    const currentData = db.getAll();
    const { dates, periode } = getWeekDates();

    const formatRekap = () => {
        let rekap = `📌 *Daftar List Tugas PR Minggu Ini* 📢\n➝ ${periode}\n\n`;
        rekap += `_________________________________\n\n`;
        const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
        const dayLabels = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

        days.forEach((day, i) => {
            rekap += `📅 *${dayLabels[i]}* ➝ ${dates[i]}\n`;
            let tugas = currentData[day];
            if (!tugas || tugas === "Belum ada tugas." || tugas === "") {
                rekap += `➝ (Tidak ada PR)\n╰───➤ 👍\n\n`;
            } else {
                rekap += `➝ ${tugas}\n\n`;
            }
        });
        rekap += `_________________________________\n\n*semangat menyelesaikan semua tugasnya! 🚀*`;
        return rekap;
    };

    await sock.readMessages([msg.key]);

    try {
        if (cmd === '!p') return await sock.sendMessage(sender, { text: '✅ *Bot Aktif!*' });

        if (cmd === '!pr') {
            await sock.sendPresenceUpdate('composing', sender);
            await delay(1000);
            return await sock.sendMessage(sender, { text: formatRekap() });
        }

        if (cmd === '!menu') {
            const menu = `📖 *Daftar Perintah Bot*\n\n🔹 !p ➜ Cek Status\n🔹 !pr ➜ Rekap PR\n\n⚙️ *Khusus Pengurus:*\n🔸 !grup ➜ Kirim Rekap ke Grup\n🔸 !update [hari] [isi] ➜ Simpan & Kirim\n🔸 !update jadwal [hari] [isi] ➜ Simpan Saja\n🔸 !hapus [hari] ➜ Kosongkan Tugas\n🔸 !info [pesan] ➜ Pengumuman Grup`;
            return await sock.sendMessage(sender, { text: menu });
        }

        // --- LOGIKA ADMIN ---
        if (['!grup', '!update', '!hapus', '!info'].includes(cmd)) {
            if (!isAdmin) return await sock.sendMessage(sender, { text: `🚫 *Akses Ditolak!*` });

            if (cmd === '!info') {
                const pesanInfo = body.slice(6).trim();
                if (!pesanInfo) return await sock.sendMessage(sender, { text: '⚠️ Isi pesannya!' });
                const pengumuman = `📢 *INFO BARU* 📢\n\n${pesanInfo}\n\n_________________________________`;
                await sock.sendMessage(ID_GRUP_TUJUAN, { text: pengumuman }); // KIRIM KE GRUP
                return await sock.sendMessage(sender, { text: '✅ Terkirim ke grup.' });
            }

            if (cmd === '!grup') {
                return await sock.sendMessage(ID_GRUP_TUJUAN, { text: formatRekap() }); // KIRIM KE GRUP
            }

            if (cmd === '!update') {
                const isOnlySave = textLower.includes('jadwal');
                const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
                let targetDay = days.find(day => textLower.includes(day));

                if (!targetDay) return await sock.sendMessage(sender, { text: '⚠️ Pilih hari! (Senin-Jumat)' });

                let content = body.replace(/!update/i, '').replace(/jadwal/i, '').replace(new RegExp(targetDay, 'gi'), '').trim();
                if (!content) return await sock.sendMessage(sender, { text: '⚠️ Isi tugasnya!' });

                db.updateTugas(targetDay, content);

                if (isOnlySave) {
                    return await sock.sendMessage(sender, { text: `✅ Berhasil Disimpan!` });
                } else {
                    const updateMsg = `📢 *UPDATE TUGAS PR: ${targetDay.toUpperCase()}*\n\n${content}\n\n_Cek list lengkap ketik *!pr*_`;
                    await sock.sendMessage(ID_GRUP_TUJUAN, { text: updateMsg }); // KIRIM KE GRUP
                    return await sock.sendMessage(sender, { text: `✅ Berhasil Update & Kirim ke Grup!` });
                }
            }

            if (cmd === '!hapus') {
                const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
                let targetDay = days.find(day => textLower.includes(day));
                if (!targetDay) return await sock.sendMessage(sender, { text: '⚠️ Pilih hari!' });
                db.updateTugas(targetDay, "Belum ada tugas.");
                return await sock.sendMessage(sender, { text: `✅ Tugas hari *${targetDay}* telah dikosongkan.` });
            }
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

module.exports = { handleMessages };
