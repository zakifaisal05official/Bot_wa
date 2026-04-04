const db = require('../data');
const { MOTIVASI_SEKOLAH } = require('../constants');

// Ganti dengan nomor WA admin (format: 628xxx@s.whatsapp.net)
const ADMIN_NUMBER = '6289531549103@s.whatsapp.net'; 
const HARI_VALID = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];

async function handleUserCommands(sock, msg, cmd, args, utils) {
    const sender = msg.key.remoteJid;
    const pushName = msg.pushName || 'User';
    const senderNumber = sender.split('@')[0];
    const { dates, periode } = utils.getWeekDates();

    const formatRekap = () => {
        const currentData = db.getAll() || {};
        const motivasi = MOTIVASI_SEKOLAH[Math.floor(Math.random() * MOTIVASI_SEKOLAH.length)];
        let rekap = `📌 *DAFTAR LIST TUGAS PR* 📢\n🗓️ Periode: ${periode}\n\n━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        HARI_VALID.forEach((day, i) => {
            const dayLabelsFull = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'];
            const dayLabelsSmall = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
            rekap += `📅 *${dayLabelsFull[i]}* (${dates[i]})\n`;
            let tugas = currentData[day];
            
            if (!tugas || tugas.trim() === "" || tugas.toLowerCase().includes("belum ada")) {
                rekap += `└─ ✅ _Tidak ada PR_\n\n`;
            } else { 
                let cleanTugas = tugas.split('\n').filter(line => !line.includes('⏰ Deadline:')).join('\n').trim();
                rekap += `${cleanTugas}\n⏰ Deadline: ${dayLabelsSmall[i]}, ${dates[i]}\n\n`; 
            }
        });
        
        rekap += `━━━━━━━━━━━━━━━━━━━━\n⏳ *BELUM DIKUMPULKAN:*\n${currentData.deadline || "_Semua tugas selesai_."}\n\n💡 _${motivasi}_\n\n⚠️ *Salah list tugas?* Lapor via *!hapus_pr*`;
        return rekap;
    };

    switch (cmd) {
        case '!cekbot':
            await sock.sendMessage(sender, { text: '✅ *Bot Syteam Aktif!* \nKetik *!bantuan* untuk melihat menu.' }); 
            break;

        case '!list_pr':
            await sock.sendMessage(sender, { text: formatRekap() }); 
            break;

        case '!jadwal':
            const currentData = db.getAll() || {};
            const inputHari = args[0]?.toLowerCase();

            let teksJadwal = `📅 *JADWAL PELAJARAN* 📅\n━━━━━━━━━━━━━━━━━━━━\n\n`;
            
            if (inputHari && HARI_VALID.includes(inputHari)) {
                const isiJadwal = currentData[`${inputHari}_jadwal`] || "_Jadwal belum diisi._";
                teksJadwal += `*${inputHari.toUpperCase()}*\n${isiJadwal}\n\n`;
            } else {
                HARI_VALID.forEach((day) => {
                    const isiJadwal = currentData[`${day}_jadwal`] || "_Belum ada jadwal._";
                    teksJadwal += `*${day.toUpperCase()}*\n${isiJadwal}\n\n`;
                });
                teksJadwal += `_Tips: Ketik *!jadwal [hari]* untuk satu hari saja._\n`;
            }
            
            teksJadwal += `━━━━━━━━━━━━━━━━━━━━`;
            await sock.sendMessage(sender, { text: teksJadwal });
            break;

        case '!tambah_pr':
            const detailAdd = args.join(" ");
            if (args.length < 2) {
                return await sock.sendMessage(sender, { 
                    text: "❌ *Format Salah!*\n\nContoh: *!tambah_pr Senin MTK hal 10*" 
                });
            }

            const hariAdd = HARI_VALID.find(h => detailAdd.toLowerCase().includes(h)) || "TIDAK TERDETEKSI";

            const pesanAdminAdd = 
                `┏━━━ « *LAPORAN PR BARU* » ━━━┓\n` +
                `┃\n` +
                `┃ 👤 *Dari:* ${pushName}\n` +
                `┃ 📱 *WA:* ${senderNumber}\n` +
                `┃ 🗓️ *Hari:* ${hariAdd.toUpperCase()}\n` +
                `┃\n` +
                `┣━━━━━━━━━━━━━━━━━━━━━━\n` +
                `┃ 📝 *ISI TUGAS:*\n` +
                `┃ _"${detailAdd}"_\n` +
                `┃\n` +
                `┗━━━━━━━━━━━━━━━━━━━━━━┛`;

            await sock.sendMessage(ADMIN_NUMBER, { text: pesanAdminAdd, mentions: [sender] });
            await sock.sendMessage(sender, { text: `✅ *Laporan Terkirim!*\nMakasih *${pushName}*, Admin bakal segera cek laporanmu.` });
            break;

        case '!hapus_pr':
            const detailClear = args.join(" ");
            if (args.length < 2) {
                return await sock.sendMessage(sender, { 
                    text: "❌ *Format Salah!*\n\nContoh: *!hapus_pr Senin MTK udah beres*" 
                });
            }

            const pesanAdminClear = 
                `┏━━━ « *REQUEST HAPUS PR* » ━━━┓\n` +
                `┃\n` +
                `┃ 👤 *Dari:* ${pushName}\n` +
                `┃ 📱 *WA:* ${senderNumber}\n` +
                `┃\n` +
                `┣━━━━━━━━━━━━━━━━━━━━━━\n` +
                `┃ 🗑️ *DETAIL HAPUS:*\n` +
                `┃ _"${detailClear}"_\n` +
                `┃\n` +
                `┗━━━━━━━━━━━━━━━━━━━━━━┛`;

            await sock.sendMessage(ADMIN_NUMBER, { text: pesanAdminClear, mentions: [sender] });
            await sock.sendMessage(sender, { text: `✅ *Request Terkirim!*\nAdmin bakal hapus list tersebut kalau datanya benar.` });
            break;

        case '!tugas_lama':
            const infoDl = (db.getAll() || {}).deadline || "Semua tugas sudah selesai.";
            await sock.sendMessage(sender, { text: `⏳ *DAFTAR TUGAS BELUM DIKUMPULKAN*\n\n${infoDl}` });
            break;
    }
}

module.exports = { handleUserCommands };
