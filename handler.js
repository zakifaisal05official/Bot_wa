const db = require('./data');
const { delay } = require("@whiskeysockets/baileys");
const fs = require('fs');
const { QUIZ_BANK } = require('./quiz'); 

// ================= CONFIG =================
const ADMIN_RAW = ['6289531549103', '171425214255294', '6285158738155']; 
const ID_GRUP_TUJUAN = '120363403625197368@g.us'; 

// ================= UTIL: AUTO DATE LOGIC =================
function getWeekDates() {
    const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
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

// --- FUNGSI DETEKSI TYPO ---
function getClosestCommand(cmd) {
    const validCommands = ['!p', '!pr', '!deadline', '!menu', '!update', '!update_jadwal', '!hapus', '!grup', '!polling', '!info', '!reset-bot'];
    if (validCommands.includes(cmd)) return null;
    
    return validCommands.find(v => {
        const distance = Math.abs(v.length - cmd.length);
        return distance <= 1 && (v.startsWith(cmd.substring(0, 2)) || cmd.startsWith(v.substring(0, 2)));
    });
}

// --- PERBAIKAN SCHEDULER: Jam 13:00 WIB & Ambil Sesuai Hari ---
async function initQuizScheduler(sock) {
    console.log("✅ Scheduler Polling Aktif (13:00 WIB)");
    let lastSentDate = ""; 

    setInterval(async () => {
        const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
        const jam = now.getHours();
        const menit = now.getMinutes();
        const hariAngka = now.getDay(); 
        const tanggalHariIni = now.getDate();

        // Kirim jam 13:00 WIB, hari Senin-Jumat, dan belum terkirim hari ini
        if (jam === 13 && menit === 0 && hariAngka >= 1 && hariAngka <= 5 && lastSentDate !== tanggalHariIni) {
            try {
                const kuisHariIni = QUIZ_BANK[hariAngka];
                if (kuisHariIni && kuisHariIni.length > 0) {
                    const randomQuiz = kuisHariIni[Math.floor(Math.random() * kuisHariIni.length)];
                    await sock.sendMessage(ID_GRUP_TUJUAN, {
                        poll: {
                            name: `🕒 *PULANG SEKOLAH CHECK*\n${randomQuiz.question}`,
                            values: randomQuiz.options,
                            selectableCount: 1
                        }
                    });
                    lastSentDate = tanggalHariIni; 
                    console.log(`[LOG] Polling otomatis hari ke-${hariAngka} terkirim.`);
                }
            } catch (err) { console.error(err); }
        }
    }, 30000); 
}

// ================= HANDLE MESSAGES =================
async function handleMessages(sock, m) {
    try {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || "").trim();
        const textLower = body.toLowerCase();
        const isAdmin = ADMIN_RAW.some(admin => sender.includes(admin));

        if (body === '!reset-bot' && isAdmin) {
            await sock.sendMessage(sender, { text: "⚠️ *MENGHAPUS SESI TOTAL...*\nBot akan restart." });
            await delay(2000); 
            fs.rmSync('./auth_info', { recursive: true, force: true });
            process.exit(1);
        }

        const triggers = ['p', 'pr', 'menu', 'update', 'update_jadwal', 'hapus', 'grup', 'info', 'deadline', 'polling'];
        const firstWord = textLower.split(' ')[0];
        
        if (!body.startsWith('!') && triggers.includes(firstWord)) {
            return await sock.sendMessage(sender, { text: `⚠️ *Format Salah!*\n\nGunakan tanda seru (*!*) di depan perintah.\n💡 Contoh: *!menu*` });
        }

        if (body.startsWith('!')) {
            const cmdInput = body.split(' ')[0].toLowerCase();
            const suggestion = getClosestCommand(cmdInput);
            const validCmds = ['!p', '!pr', '!deadline', '!menu', '!update', '!update_jadwal', '!hapus', '!grup', '!polling', '!info', '!reset-bot'];
            
            if (!validCmds.includes(cmdInput) && suggestion) {
                return await sock.sendMessage(sender, { text: `🧐 *Perintah tidak dikenal.*\n\nMungkin maksud Anda: *${suggestion}* ?\nKetik *!menu* untuk melihat semua perintah.` });
            }
        }

        if (!body.startsWith('!')) {
            if (!sender.endsWith('@g.us')) {
                return await sock.sendMessage(sender, { text: `Halo! Ada yang bisa dibantu?\n\nKetik *!menu* untuk melihat daftar perintah.` });
            }
            return;
        }

        await sock.readMessages([msg.key]);
        const args = body.split(' ');
        const cmd = args[0].toLowerCase();
        const { dates, periode } = getWeekDates();

        const formatRekap = () => {
            const currentData = db.getAll();
            let rekap = `📌 *DAFTAR LIST TUGAS PR* 📢\n🗓️ Periode: ${periode}\n`;
            rekap += `\n━━━━━━━━━━━━━━━━━━━━\n\n`;
            
            const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
            const dayLabels = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

            days.forEach((day, i) => {
                rekap += `📅 *${dayLabels[i]}* (${dates[i]})\n`;
                let tugas = currentData[day];
                if (!tugas || tugas.includes("Belum ada tugas") || tugas === "") {
                    rekap += `└─ ✅ _Tidak ada PR_\n\n`;
                } else {
                    rekap += `└─ 📝 ${tugas}\n\n`;
                }
            });

            rekap += `━━━━━━━━━━━━━━━━━━━━\n`;
            rekap += `⏳ *DAFTAR TUGAS BELUM DIKUMPULKAN:*\n${currentData.deadline || "Semua tugas sudah selesai."}\n\n`;
            rekap += `⚠️ *Salah list tugas?*\nHubungi nomor: *089531549103*`;
            return rekap;
        };

        const sendToGroupSafe = async (content) => {
            try {
                await sock.sendPresenceUpdate('composing', ID_GRUP_TUJUAN);
                await delay(2000);
                await sock.sendMessage(ID_GRUP_TUJUAN, content);
                return true;
            } catch (err) { return false; }
        };

        switch (cmd) {
            case '!p':
                await sock.sendMessage(sender, { text: '✅ *Bot Aktif & Terkoneksi!*' });
                break;

            case '!pr':
                await sock.sendMessage(sender, { text: formatRekap() });
                break;

            case '!deadline':
                if (args.length === 1) {
                    const infoDl = db.getAll().deadline || "Semua tugas sudah selesai.";
                    await sock.sendMessage(sender, { text: `⏳ *DAFTAR TUGAS BELUM DIKUMPULKAN*\n\n${infoDl}` });
                } else {
                    if (!isAdmin) return;
                    db.updateTugas('deadline', body.slice(10).trim());
                    await sock.sendMessage(sender, { text: `✅ Daftar tugas belum dikumpul diperbarui!` });
                }
                break;

            case '!menu':
                const menu = `📖 *MENU BOT TUGAS*\n\n*PENGGUNA:* \n🔹 !p - Cek Aktif\n🔹 !pr - List Tugas\n🔹 !deadline - Daftar Belum Dikumpul\n\n*PENGURUS:* \n🔸 !update [hari] [tugas]\n🔸 !update_jadwal [hari] [tugas]\n🔸 !deadline [isi info]\n🔸 !hapus [hari/deadline]\n🔸 !grup (Kirim rekap ke grup)\n🔸 !polling\n🔸 !info [pesan]`;
                await sock.sendMessage(sender, { text: menu });
                break;
            
            case '!polling':
                if (!isAdmin) return;
                const hNow = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"})).getDay();
                const pool = QUIZ_BANK[hNow] || QUIZ_BANK[1];
                const q = pool[Math.floor(Math.random() * pool.length)];
                await sock.sendMessage(ID_GRUP_TUJUAN, {
                    poll: { name: `📊 *POLLING*\n${q.question}`, values: q.options, selectableCount: 1 }
                });
                break;

            case '!info':
            case '!grup':
            case '!update':
            case '!update_jadwal':
            case '!hapus':
                if (!isAdmin) return;

                if (cmd === '!info') {
                    const infoMessage = body.slice(6).trim();
                    if (!infoMessage) return;
                    await sendToGroupSafe({ text: `📢 *PENGUMUMAN*\n\n${infoMessage}\n\n_— Pengurus_` });
                    await sock.sendMessage(sender, { text: '✅ Terkirim.' });
                }

                if (cmd === '!grup') {
                    await sendToGroupSafe({ text: formatRekap() });
                    await sock.sendMessage(sender, { text: '✅ Rekap terkirim.' });
                }

                if (cmd === '!update') {
                    const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
                    const dayLabels = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
                    let dayIdx = days.findIndex(day => textLower.includes(day));
                    if (dayIdx === -1) return;

                    let targetDay = days[dayIdx];
                    let labelDay = dayLabels[dayIdx];
                    let dateDay = dates[dayIdx];

                    let content = body.replace(/!update/i, '').replace(new RegExp(targetDay, 'gi'), '').trim();
                    db.updateTugas(targetDay, content);
                    
                    const pesanGrup = `📌 *Daftar tugas/ pr di Minggu ini* 📢\n` +
                                     `➝ ${periode}\n\n` +
                                     `---------------------------------------------------------------------------------\n\n\n` +
                                     `*\`📅 ${labelDay}\`* ➝ ${dateDay}\n\n` +
                                     `${content}`;

                    await sendToGroupSafe({ text: pesanGrup });
                    await sock.sendMessage(sender, { text: `✅ Berhasil Update!` });
                }

                if (cmd === '!update_jadwal') {
                    const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
                    let targetDay = days.find(day => textLower.includes(day));
                    if (!targetDay) return;

                    let content = body.replace(/!update_jadwal/i, '').replace(new RegExp(targetDay, 'gi'), '').trim();
                    db.updateTugas(targetDay, content);
                    
                    await sock.sendMessage(sender, { text: `✅ Berhasil simpan ke data (tanpa kirim ke grup).` });
                }

                if (cmd === '!hapus') {
                    const keys = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'deadline'];
                    let targetKey = keys.find(key => textLower.includes(key));
                    if (!targetKey) return;
                    
                    db.updateTugas(targetKey, targetKey === 'deadline' ? "Semua tugas sudah selesai." : "Belum ada tugas.");
                    await sock.sendMessage(sender, { text: `✅ Data *${targetKey}* telah dibersihkan.` });
                }
                break;
        }
    } catch (err) { console.error(err); }
}

module.exports = { handleMessages, initQuizScheduler };
