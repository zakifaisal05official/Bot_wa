const db = require('./data');
const { delay } = require("@whiskeysockets/baileys");
const fs = require('fs');

const ADMIN_RAW = ['6289531549103', '171425214255294', '6285158738155']; 
const ID_GRUP_TUJUAN = '120363403625197368@g.us'; 
const NOMOR_ADMIN_BANTUAN = '089531549103'; 

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
    return { dates, periode: `${dates[0]} - ${dates[4]}` };
}

async function handleMessages(sock, m) {
    try {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || "").trim();
        const textLower = body.toLowerCase();
        const isAdmin = ADMIN_RAW.some(admin => sender.includes(admin));

        // --- BALASAN OTOMATIS (DEFAULT RESPONSE) ---
        if (!body.startsWith('!')) {
            if (!sender.endsWith('@g.us')) {
                return await sock.sendMessage(sender, { 
                    text: `Halo! Ada yang bisa dibantu?\n\nKetik *!pr* untuk list tugas atau *!deadline* untuk info kerja kelompok.\n\nJika ada salah list hubungi: ${NOMOR_ADMIN_BANTUAN}` 
                });
            }
            return;
        }

        const args = body.split(' ');
        const cmd = args[0].toLowerCase();
        const { dates, periode } = getWeekDates();

        // --- REKAP GENERATOR ---
        const formatRekap = () => {
            const currentData = db.getAll();
            let rekap = `📌 *DAFTAR LIST TUGAS PR* 📢\n🗓️ Periode: ${periode}\n`;
            rekap += `\n━━━━━━━━━━━━━━━━━━━━\n\n`;
            
            ['senin', 'selasa', 'rabu', 'kamis', 'jumat'].forEach((day, i) => {
                const dayLabels = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
                let tugas = currentData[day] || "Belum ada tugas.";
                rekap += `📅 *${dayLabels[i]}* (${dates[i]})\n└─ ${tugas}\n\n`;
            });

            rekap += `━━━━━━━━━━━━━━━━━━━━\n`;
            rekap += `⏳ *DEADLINE / KELOMPOK:*\n${currentData.deadline || "Belum ada info."}\n\n`;
            rekap += `💬 *Salah list?* Hubungi: ${NOMOR_ADMIN_BANTUAN}`;
            return rekap;
        };

        // --- LOGIKA PERINTAH ---
        switch (cmd) {
            case '!pr':
                await sock.sendMessage(sender, { text: formatRekap() });
                break;

            case '!deadline':
                if (args.length === 1) {
                    const info = db.getAll().deadline || "Belum ada info deadline.";
                    await sock.sendMessage(sender, { text: `⏳ *INFO DEADLINE & KELOMPOK*\n\n${info}` });
                } else if (isAdmin) {
                    const isiDeadline = body.slice(10).trim();
                    db.updateTugas('deadline', isiDeadline);
                    await sock.sendMessage(sender, { text: "✅ Info Deadline berhasil disimpan!" });
                }
                break;

            case '!update':
                if (!isAdmin) return;
                const hariUpdate = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'].find(h => textLower.includes(h));
                if (!hariUpdate) return await sock.sendMessage(sender, { text: "⚠️ Pilih hari! Contoh: !update senin Matematika hal 10" });
                
                const isiTugas = body.replace(new RegExp(`^${cmd}\\s+${hariUpdate}`, 'i'), '').trim();
                db.updateTugas(hariUpdate, isiTugas);
                await sock.sendMessage(sender, { text: `✅ Berhasil update hari ${hariUpdate}.` });
                break;

            case '!hapus':
                if (!isAdmin) return;
                const targetHapus = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'deadline'].find(h => textLower.includes(h));
                if (!targetHapus) return await sock.sendMessage(sender, { text: "⚠️ Pilih apa yang mau dihapus (senin-jumat/deadline)!" });
                
                db.updateTugas(targetHapus, targetHapus === 'deadline' ? "Belum ada info." : "Belum ada tugas.");
                await sock.sendMessage(sender, { text: `✅ Data *${targetHapus}* berhasil dihapus/dibersihkan.` });
                break;

            case '!menu':
                await sock.sendMessage(sender, { text: `📖 *MENU BOT*\n\n!pr - Cek semua tugas\n!deadline - Cek kerja kelompok\n\n*ADMIN:*\n!update [hari] [tugas]\n!deadline [isi info]\n!hapus [hari/deadline]\n!reset-bot` });
                break;
        }

    } catch (err) { console.error(err); }
}

module.exports = { handleMessages };
