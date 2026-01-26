const db = require('./data');

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
    if (!body.startsWith('!')) return;

    const isAdmin = ADMIN_RAW.some(admin => sender.includes(admin));
    const cmd = body.split(' ')[0].toLowerCase();
    const currentData = db.getAll();
    const dates = getWeekDates();

    await sock.readMessages([msg.key]);

    if (cmd === '!pr') {
        const rekap = `📌 *Daftar List Tugas PR Minggu Ini* 📢
→ ${dates[0]} - ${dates[4]}

_________________________________

📅 *Senin* → ${dates[0]}
${currentData.senin === "Belum ada tugas." ? "→ (Tidak ada PR)\n╰───➤ 👍" : currentData.senin}

📅 *Selasa* → ${dates[1]}
${currentData.selasa}

📅 *Rabu* → ${dates[2]}
${currentData.rabu}

📅 *Kamis* → ${dates[3]}
${currentData.kamis}

📅 *Jumat* → ${dates[4]}
${currentData.jumat}

_________________________________

*semangat menyelesaikan semua tugasnya! 🚀*`;

        await sock.sendMessage(sender, { text: rekap });
    }

    // Perintah Admin untuk Update
    else if (cmd === '!update' && isAdmin) {
        const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
        let day = days.find(d => body.toLowerCase().includes(d));
        if (!day) return await sock.sendMessage(sender, { text: "Contoh: !update senin Matematika hal 10" });
        
        let val = body.split(day)[1]?.trim();
        db.updateTugas(day, val);
        await sock.sendMessage(sender, { text: `✅ Berhasil update tugas hari ${day}` });
    }
}

module.exports = { handleMessages };
