const db = require('./data');
const { delay } = require("@whiskeysockets/baileys");

// ================= CONFIG =================
const ADMIN_RAW = ['6289531549103', '171425214255294', '6285158738155']; 
const NOMOR_PENGURUS = '089531549103';
const NAMA_GRUP = '🎒Tugas & Jadwal Sekolah [Y.M.B] ✍️';

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
    return dates;
}

// Fungsi deteksi typo sederhana
function checkSimilarity(input, target) {
    return target.includes(input) || input.includes(target);
}

async function handleMessages(sock, m) {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const sender = msg.key.remoteJid;
    const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
    
    // Memberi peringatan jika user lupa memakai tanda seru (!)
    const textLower = body.toLowerCase();
    const triggers = ['p', 'pr', 'menu', 'update', 'hapus', 'info'];
    if (!body.startsWith('!') && triggers.includes(textLower)) {
        return await sock.sendMessage(sender, { text: `⚠️ *Format Salah!*\n\nGunakan tanda seru (*!*) di depan perintah.\nContoh: *!menu*` });
    }

    if (!body.startsWith('!')) return;

    const isAdmin = ADMIN_RAW.some(admin => sender.includes(admin));
    const args = body.split(' ');
    const cmd = args[0].toLowerCase();
    const currentData = db.getAll();
    const dates = getWeekDates();

    await sock.readMessages([msg.key]);

    try {
        // --- 1. CEK TYPO PERINTAH ---
        const validCmds = ['!p', '!pr', '!menu', '!update', '!hapus', '!info'];
        if (!validCmds.includes(cmd)) {
            let suggestion = validCmds.find(v => checkSimilarity(cmd.replace('!', ''), v.replace('!', '')));
            if (suggestion) {
                return await sock.sendMessage(sender, { text: `⚠️ Perintah *${cmd}* tidak dikenal.\nMungkin maksud kamu: *${suggestion}*?` });
            }
        }

        // --- 2. FITUR PUBLIK ---
        if (cmd === '!p') {
            await sock.sendPresenceUpdate('composing', sender);
            await sock.sendMessage(sender, { text: '✅ *Bot Online & Responsif!*' });
        } 
        
        else if (cmd === '!pr') {
            await sock.sendPresenceUpdate('composing', sender);
            await delay(2000); 

            let rekap = `📌 *Daftar List Tugas PR Minggu Ini* 📢\n`;
            rekap += `→ ${dates[0]} - ${dates[4]}\n\n`;
            rekap += `_________________________________\n\n`;
            
            const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
            const dayLabels = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

            days.forEach((day, i) => {
                rekap += `📅 *${dayLabels[i]}* → ${dates[i]}\n`;
                if (currentData[day] === "Belum ada tugas." || !currentData[day]) {
                    rekap += i === 0 ? `→ (Tidak ada PR)\n╰───➤ 👍\n\n` : `Belum ada tugas.\n\n`;
                } else {
                    rekap += `→ ${currentData[day]}\n\n`;
                }
            });
            
            rekap += `_________________________________\n\n`;
            rekap += `*semangat menyelesaikan semua tugasnya! 🚀*`;

            await sock.sendMessage(sender, { text: rekap });
        }

        else if (cmd === '!menu') {
            await sock.sendPresenceUpdate('composing', sender);
            const menuText = `╭───  *BOT TUGAS SEKOLAH* ────\n` +
                `│\n` +
                `│ 📝 *Menu Publik:*\n` +
                `│ ➜ *!p* (Cek Status)\n` +
                `│ ➜ *!pr* (Lihat List PR)\n` +
                `│\n` +
                `│ ⚙️ *Menu Admin:*\n` +
                `│ ➜ *!update [hari] [isi]*\n` +
                `│ ➜ *!hapus [hari]*\n` +
                `│ ➜ *!info [pesan]*\n` +
                `│\n` +
                `╰──────────────────────────`;
            await sock.sendMessage(sender, { text: menuText });
        }

        // --- 3. FITUR ADMIN ONLY ---
        else if (['!update', '!hapus', '!info'].includes(cmd)) {
            if (!isAdmin) {
                return await sock.sendMessage(sender, { text: `🚫 *AKSES DITOLAK*\n\nKhusus *Pengurus Kelas*.\nHubungi: wa.me/${NOMOR_PENGURUS}` });
            }

            if (cmd === '!update') {
                const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
                let day = days.find(d => body.toLowerCase().includes(d));
                if (!day) return await sock.sendMessage(sender, { text: "⚠️ Contoh: !update senin Matematika hal 10" });
                
                let val = body.split(day)[1]?.trim();
                if (!val) return await sock.sendMessage(sender, { text: "⚠️ Isi tugasnya tidak boleh kosong!" });

                db.updateTugas(day, val);
                await sock.sendMessage(sender, { text: `✅ Berhasil update tugas hari *${day}*!` });
            }

            else if (cmd === '!hapus') {
                const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
                let day = days.find(d => body.toLowerCase().includes(d));
                if (!day) return await sock.sendMessage(sender, { text: "⚠️ Contoh: !hapus senin" });

                db.resetHari(day);
                await sock.sendMessage(sender, { text: `🗑️ Data tugas hari *${day}* telah dihapus.` });
            }

            else if (cmd === '!info') {
                const pesanInfo = body.replace(/!info/i, '').trim();
                if (!pesanInfo) return await sock.sendMessage(sender, { text: '⚠️ Ketik pesan infonya!' });

                const pengumuman = `📢 *PENGUMUMAN INFO BARU* 📢\n\n${pesanInfo}\n\n_________________________________\n_Info dari: Pengurus List Tugas_`;
                await sock.sendMessage(sender, { text: pengumuman });
            }
        }
        
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sock.sendPresenceUpdate('paused', sender);
    }
}

module.exports = { handleMessages };
