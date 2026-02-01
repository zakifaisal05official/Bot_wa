const db = require('./data');
const { delay } = require("@whiskeysockets/baileys");
const fs = require('fs');
const { QUIZ_BANK } = require('./quiz'); 
const { MAPEL_CONFIG, STRUKTUR_JADWAL, LABELS } = require('./pelajaran');

const ADMIN_RAW = ['6289531549103', '171425214255294', '6285158738155' , '241849843351688' , '254326740103190' , '8474121494667']; 
const ID_GRUP_TUJUAN = '120363403625197368@g.us'; 

function getClosestCommand(cmd) {
    const validCommands = ['!p', '!pr', '!deadline', '!menu', '!update', '!update_jadwal', '!hapus', '!grup', '!polling', '!info', '!reset-bot', '!polling_kirim', '!data'];
    if (validCommands.includes(cmd)) return null;
    return validCommands.find(v => {
        const distance = Math.abs(v.length - cmd.length);
        return distance <= 1 && (v.startsWith(cmd.substring(0, 2)) || cmd.startsWith(v.substring(0, 2)));
    });
}

async function handleMessages(sock, m, kuisAktif, utils) {
    try {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const sender = msg.key.remoteJid;
        const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || "").trim();
        const textLower = body.toLowerCase();
        const isAdmin = ADMIN_RAW.some(admin => sender.includes(admin));
        const nonAdminMsg = "🚫 *AKSES DITOLAK*\n\nMaaf, fitur ini hanya bisa diakses oleh *Pengurus*. Kamu adalah pengguna biasa, silakan gunakan fitur pengguna seperti *!pr* atau *!deadline* saja ya! 😊";

        if (body === '!reset-bot') {
            if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
            await sock.sendMessage(sender, { text: "⚠️ *MENGHAPUS SESI TOTAL...*\nBot akan restart." });
            await delay(2000); 
            if (fs.existsSync('./auth_info')) fs.rmSync('./auth_info', { recursive: true, force: true });
            process.exit(1);
        }

        const triggers = ['p', 'pr', 'menu', 'update', 'update_jadwal', 'hapus', 'grup', 'info', 'deadline', 'polling', 'polling_kirim', 'data'];
        const firstWord = textLower.split(' ')[0].replace('!', '');
        if (!body.startsWith('!') && triggers.includes(firstWord)) {
            return await sock.sendMessage(sender, { text: `⚠️ *Format Salah!*\n\nGunakan tanda seru (*!*) di depan perintah.\n💡 Contoh: *!menu*` });
        }

        if (body.startsWith('!')) {
            const cmdInput = body.split(' ')[0].toLowerCase();
            const suggestion = getClosestCommand(cmdInput);
            const validCmds = ['!p', '!pr', '!deadline', '!menu', '!update', '!update_jadwal', '!hapus', '!grup', '!polling', '!info', '!reset-bot', '!polling_kirim', '!data'];
            if (!validCmds.includes(cmdInput) && suggestion) {
                return await sock.sendMessage(sender, { text: `🧐 *Perintah tidak dikenal.*\n\nMungkin maksud Anda: *${suggestion}* ?\nKetik *!menu* untuk melihat semua perintah.` });
            }
        }

        if (!body.startsWith('!')) return;

        await sock.readMessages([msg.key]);
        const args = body.split(' ');
        const cmd = args[0].toLowerCase();
        const { dates, periode } = utils.getWeekDates();

        const getProcessedTask = (dayKey, input) => {
            const dayMap = { 'senin': 0, 'selasa': 1, 'rabu': 2, 'kamis': 3, 'jumat': 4 };
            const dayLabels = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
            let allData = db.getAll() || {};
            let currentData = allData[dayKey] || "";
            let organized = [];
            STRUKTUR_JADWAL[dayKey].forEach(mKey => {
                const emojiMapel = MAPEL_CONFIG[mKey];
                if (input.toLowerCase().includes(mKey.toLowerCase())) {
                    let parts = input.toLowerCase().split(mKey.toLowerCase());
                    let desc = (parts[1] && parts[1].trim() !== "") ? parts[1].split('label:')[0].trim() : "";
                    if (desc === "") return;
                    let lbl = LABELS['biasa'];
                    for (let l in LABELS) { if (input.toLowerCase().includes(l.toLowerCase())) { lbl = LABELS[l]; break; } }
                    organized.push(`• ${emojiMapel}\n➝ ${desc}\n--} ${lbl} |\n⏰ Deadline: ${dayLabels[dayMap[dayKey]]}, ${dates[dayMap[dayKey]]}`);
                } else {
                    const exist = currentData.split('\n\n').find(s => s.includes(emojiMapel));
                    if (exist) organized.push(exist);
                }
            });
            return organized.join('\n\n');
        };

        const formatRekap = () => {
            const currentData = db.getAll() || {};
            let rekap = `📌 *DAFTAR LIST TUGAS PR* 📢\n🗓️ Periode: ${periode}\n\n━━━━━━━━━━━━━━━━━━━━\n\n`;
            ['senin', 'selasa', 'rabu', 'kamis', 'jumat'].forEach((day, i) => {
                rekap += `📅 *${day.toUpperCase()}* (${dates[i]})\n`;
                let tugas = currentData[day];
                if (!tugas || tugas.includes("Belum ada tugas") || tugas === "") {
                    rekap += `└─ ✅ _Tidak ada PR_\n\n`;
                } else { rekap += `${tugas}\n\n`; }
            });
            rekap += `━━━━━━━━━━━━━━━━━━━━\n⏳ *DAFTAR TUGAS BELUM DIKUMPULKAN:*\n${currentData.deadline || "Semua tugas sudah selesai."}\n\n⚠️ *Salah list tugas?*\nHubungi nomor: *089531549103*`;
            return rekap;
        };

        const sendToGroupSafe = async (content) => {
            await sock.sendPresenceUpdate('composing', ID_GRUP_TUJUAN);
            await delay(2000);
            await sock.sendMessage(ID_GRUP_TUJUAN, content);
        };

        switch (cmd) {
            case '!p': await sock.sendMessage(sender, { text: '✅ *Bot Aktif & Terkoneksi!*' }); break;
            case '!pr': await sock.sendMessage(sender, { text: formatRekap() }); break;
            case '!deadline':
                if (args.length === 1) {
                    const infoDl = (db.getAll() || {}).deadline || "Semua tugas sudah selesai.";
                    await sock.sendMessage(sender, { text: `⏳ *DAFTAR TUGAS BELUM DIKUMPULKAN*\n\n${infoDl}` });
                } else {
                    if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
                    db.updateTugas('deadline', body.slice(10).trim());
                    await sock.sendMessage(sender, { text: `✅ Daftar tugas belum dikumpul diperbarui!` });
                }
                break;
            case '!menu':
                const menu = `📖 *MENU BOT TUGAS*\n\n*PENGGUNA:* \n🔹 !p - Cek Aktif\n🔹 !pr - List Tugas\n🔹 !deadline - Daftar Belum Dikumpul\n🔹 !data - Cek Jadwal Besok\n\n*PENGURUS:* \n🔸 !update [hari] [tugas]\n🔸 !update_jadwal [hari] [tugas]\n🔸 !deadline [isi info]\n🔸 !hapus [hari/deadline]\n🔸 !grup (Kirim rekap ke grup)\n🔸 !polling [soal] | [opsi:feedback]\n🔸 !polling_kirim [hari]\n🔸 !info [pesan]`;
                await sock.sendMessage(sender, { text: menu });
                break;
            case '!data':
                // Memanggil fungsi dari scheduler melalui objek utils
                if (utils.sendJadwalBesokManual) {
                    await utils.sendJadwalBesokManual(sock);
                    if (sender !== ID_GRUP_TUJUAN) await sock.sendMessage(sender, { text: "✅ *Jadwal Besok telah dikirim ke grup!*" });
                }
                break;
            case '!polling':
                if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
                const inputPoll = body.slice(9).trim();
                if (!inputPoll.includes('|')) return await sock.sendMessage(sender, { text: "⚠️ *FORMAT SALAH*\nContoh: !polling Soal | Opsi1:Feedback1, Opsi2:Feedback2" });
                const [pertanyaan, mentahanOpsi] = inputPoll.split('|');
                const listOpsi = mentahanOpsi.split(',').map(v => v.trim());
                const finalOptions = [], finalFeedbacks = [];
                listOpsi.forEach(item => {
                    const [opt, feed] = item.split(':');
                    if (opt && feed) { finalOptions.push(opt.trim()); finalFeedbacks.push(feed.trim()); }
                });
                const sMsg = await sock.sendMessage(ID_GRUP_TUJUAN, { poll: { name: `📊 *POLLING ADMIN*\n${pertanyaan.trim()}`, values: finalOptions, selectableCount: 1 } });
                kuisAktif.msgId = sMsg.key.id;
                kuisAktif.data = { question: pertanyaan.trim(), options: finalOptions, feedbacks: finalFeedbacks };
                break;
            case '!update':
            case '!update_jadwal':
                if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
                const daysUpdate = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
                let dIdx = daysUpdate.findIndex(d => textLower.includes(d));
                if (dIdx === -1) return await sock.sendMessage(sender, { text: "❌ *HARI TIDAK DITEMUKAN*" });
                let res = getProcessedTask(daysUpdate[dIdx], body);
                db.updateTugas(daysUpdate[dIdx], res);
                if (cmd === '!update') await sendToGroupSafe({ text: `📌 *Daftar tugas/ pr di Minggu ini* 📢\n➝ ${periode}\n\n---------------------------------------------------------------------------------\n\n\n*\`📅 ${daysUpdate[dIdx].toUpperCase()}\`* ➝ ${dates[dIdx]}\n\n${res}` });
                await sock.sendMessage(sender, { text: `✅ Berhasil Update!` });
                break;
            case '!grup':
                if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
                await sendToGroupSafe({ text: formatRekap() });
                break;
            case '!info':
                if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
                const info = body.slice(6).trim();
                if (info) await sendToGroupSafe({ text: `📢 *PENGUMUMAN*\n\n${info}\n\n_— Pengurus_` });
                break;
        }
    } catch (err) { console.error(err); }
}

module.exports = { handleMessages };
                                                                 
