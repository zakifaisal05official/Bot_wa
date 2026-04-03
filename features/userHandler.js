const db = require('../data');
const { MOTIVASI_SEKOLAH } = require('../constants');

async function handleUserCommands(sock, msg, cmd, args, utils) {
    const sender = msg.key.remoteJid;
    const { dates, periode } = utils.getWeekDates();

    const formatRekap = () => {
        const currentData = db.getAll() || {};
        const motivasi = MOTIVASI_SEKOLAH[Math.floor(Math.random() * MOTIVASI_SEKOLAH.length)];
        let rekap = `📌 *DAFTAR LIST TUGAS PR* 📢\n🗓️ Periode: ${periode}\n\n━━━━━━━━━━━━━━━━━━━━\n\n`;
        ['senin', 'selasa', 'rabu', 'kamis', 'jumat'].forEach((day, i) => {
            const dayLabelsFull = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'];
            const dayLabelsSmall = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
            rekap += `📅 *${dayLabelsFull[i]}* (${dates[i]})\n`;
            let tugas = currentData[day];
            
            if (!tugas || tugas.trim() === "" || tugas.includes("Belum ada tugas")) {
                rekap += `└─ ✅ _Tidak ada PR_\n\n`;
            } else { 
                let cleanTugas = tugas.split('\n').filter(line => !line.includes('⏰ Deadline:')).join('\n').trim();
                let updatedTugas = cleanTugas.replace(/(\|)$/gm, `$1\n⏰ Deadline: ${dayLabelsSmall[i]}, ${dates[i]}`);
                
                if (!updatedTugas.includes('⏰ Deadline:')) {
                    updatedTugas += `\n⏰ Deadline: ${dayLabelsSmall[i]}, ${dates[i]}`;
                }
                rekap += `${updatedTugas}\n\n`; 
            }
        });
        rekap += `━━━━━━━━━━━━━━━━━━━━\n⏳ *DAFTAR TUGAS BELUM DIKUMPULKAN:*\n${currentData.deadline || "Semua tugas sudah selesai."}\n\n💡 _${motivasi}_\n\n⚠️ *Salah list tugas?*\nHubungi nomor: *089531549103*`;
        return rekap;
    };

    switch (cmd) {
        case '!p': await sock.sendMessage(sender, { text: '✅ *Bot Aktif & Terkoneksi!*' }); break;
        case '!pr': await sock.sendMessage(sender, { text: formatRekap() }); break;
        case '!deadline':
            if (args.length === 1) {
                const infoDl = (db.getAll() || {}).deadline || "Semua tugas sudah selesai.";
                await sock.sendMessage(sender, { text: `⏳ *DAFTAR TUGAS BELUM DIKUMPULKAN*\n\n${infoDl}` });
            }
            break;
    }
}

module.exports = { handleUserCommands };
