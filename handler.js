const db = require('./data');
const { delay } = require("@whiskeysockets/baileys");

const ADMIN_RAW = ['6289531549103', '171425214255294', '6285158738155']; 

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

async function handleMessages(sock, m) {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const sender = msg.key.remoteJid;
    const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
    
    // Pastikan hanya merespon perintah dengan tanda seru
    if (!body.startsWith('!')) return;

    const isAdmin = ADMIN_RAW.some(admin => sender.includes(admin));
    const cmd = body.split(' ')[0].toLowerCase();
    const currentData = db.getAll();
    const dates = getWeekDates();

    // 1. Baca Pesan
    await sock.readMessages([msg.key]);

    try {
        if (cmd === '!pr') {
            // 2. Simulasi Mengetik
            await sock.sendPresenceUpdate('composing', sender);
            await delay(2000); 

            // Susun Pesan sesuai Screenshot
            let rekap = `📌 *Daftar List Tugas PR Minggu Ini* 📢\n`;
            rekap += `→ ${dates[0]} - ${dates[4]}\n\n`;
            rekap += `_________________________________\n\n`;
            
            rekap += `📅 *Senin* → ${dates[0]}\n`;
            rekap += `${currentData.senin === "Belum ada tugas." ? "→ (Tidak ada PR)\n╰───➤ 👍" : currentData.senin}\n\n`;
            
            rekap += `📅 *Selasa* → ${dates[1]}\n`;
            rekap += `${currentData.selasa === "Belum ada tugas." ? "Belum ada tugas." : currentData.selasa}\n\n`;
            
            rekap += `📅 *Rabu* → ${dates[2]}\n`;
            rekap += `${currentData.rabu === "Belum ada tugas." ? "Belum ada tugas." : currentData.rabu}\n\n`;
            
            rekap += `📅 *Kamis* → ${dates[3]}\n`;
            rekap += `${currentData.kamis === "Belum ada tugas." ? "Belum ada tugas." : currentData.kamis}\n\n`;
            
            rekap += `📅 *Jumat* → ${dates[4]}\n`;
            rekap += `${currentData.jumat === "Belum ada tugas." ? "Belum ada tugas." : currentData.jumat}\n\n`;
            
            rekap += `_________________________________\n\n`;
            rekap += `*semangat menyelesaikan semua tugasnya! 🚀*`;

            await sock.sendMessage(sender, { text: rekap });
        }

        else if (cmd === '!p') {
            await sock.sendPresenceUpdate('composing', sender);
            await delay(1000);
            await sock.sendMessage(sender, { text: '✅ *Bot Online & Siap Membantu!*' });
        }

        else if (cmd === '!update' && isAdmin) {
            const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
            let day = days.find(d => body.toLowerCase().includes(d));
            
            if (!day) return await sock.sendMessage(sender, { text: "⚠️ Contoh: !update senin Matematika hal 10" });
            
            let val = body.split(day)[1]?.trim();
            if (!val) return await sock.sendMessage(sender, { text: "⚠️ Isi tugasnya tidak boleh kosong!" });

            db.updateTugas(day, val);
            await sock.sendMessage(sender, { text: `✅ Berhasil update tugas hari *${day}*!` });
        }
        
    } catch (err) {
        console.error("Gagal memproses pesan:", err);
    } finally {
        await sock.sendPresenceUpdate('paused', sender);
    }
}

module.exports = { handleMessages };
