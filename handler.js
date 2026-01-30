const db = require('./data');
const { delay } = require("@whiskeysockets/baileys");
const fs = require('fs');
const { QUIZ_BANK } = require('./quiz'); 
const { JADWAL_PELAJARAN, MOTIVASI_SEKOLAH } = require('./constants');
const { MAPEL_CONFIG, STRUKTUR_JADWAL, LABELS } = require('./pelajaran');

// ================= CONFIG =================
const ADMIN_RAW = ['6289531549103', '171425214255294', '6285158738155' , '241849843351688' , '254326740103190' , '8474121494667']; 
const ID_GRUP_TUJUAN = '120363403625197368@g.us'; 

let kuisAktif = { msgId: null, data: null, votes: {} };

// ================= UTIL: AUTO DATE LOGIC =================
function getWIBDate() {
    // Memaksa waktu ke Asia/Jakarta untuk server USA
    return new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
}

function getWeekDates() {
    const now = getWIBDate();
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

function getClosestCommand(cmd) {
    const validCommands = ['!p', '!pr', '!deadline', '!menu', '!update', '!update_jadwal', '!hapus', '!grup', '!polling', '!info', '!reset-bot'];
    if (validCommands.includes(cmd)) return null;
    return validCommands.find(v => {
        const distance = Math.abs(v.length - cmd.length);
        return distance <= 1 && (v.startsWith(cmd.substring(0, 2)) || cmd.startsWith(v.substring(0, 2)));
    });
}

// --- SCHEDULER: Polling ---
async function initQuizScheduler(sock) {
    console.log("✅ Scheduler Polling Aktif (Sen-Kam 14:00, Jum 11:00 WIB)");
    let lastSentDate = ""; 

    setInterval(async () => {
        const now = getWIBDate();
        const jam = now.getHours();
        const menit = now.getMinutes();
        const hariAngka = now.getDay(); 
        const tglID = `${now.getDate()}-${now.getMonth()}`;

        const targetJam = (hariAngka === 5) ? 11 : 14;

        if (jam === targetJam && menit === 0 && hariAngka >= 1 && hariAngka <= 5 && lastSentDate !== tglID) {
            try {
                const kuisHariIni = QUIZ_BANK[hariAngka];
                if (kuisHariIni && kuisHariIni.length > 0) {
                    const randomQuiz = kuisHariIni[Math.floor(Math.random() * kuisHariIni.length)];
                    const sentMsg = await sock.sendMessage(ID_GRUP_TUJUAN, {
                        poll: {
                            name: `🕒 *PULANG SEKOLAH CHECK*\n${randomQuiz.question}`,
                            values: randomQuiz.options,
                            selectableCount: 1
                        }
                    });
                    kuisAktif = { msgId: sentMsg.key.id, data: randomQuiz, votes: {} };
                    lastSentDate = tglID; 
                }
            } catch (err) { console.error("Quiz Error:", err); }
        }
    }, 35000); 
}

// --- SCHEDULER: Feedback ---
async function initSmartFeedbackScheduler(sock) {
    console.log("✅ Scheduler Smart Feedback Aktif");
    let lastResultDate = "";

    setInterval(async () => {
        const now = getWIBDate();
        const jam = now.getHours();
        const menit = now.getMinutes();
        const hari = now.getDay();
        const tglID = `${now.getDate()}-${now.getMonth()}`;

        const jamRespon = (hari === 5) ? 13 : 16;

        if (jam === jamRespon && menit === 0 && lastResultDate !== tglID) {
            if (kuisAktif.msgId && kuisAktif.data) {
                try {
                    const counts = {};
                    Object.values(kuisAktif.votes).forEach(v => {
                        const idx = v[0];
                        counts[idx] = (counts[idx] || 0) + 1;
                    });

                    let topIdx = 0;
                    let maxVotes = -1;
                    for (let i = 0; i < kuisAktif.data.options.length; i++) {
                        if ((counts[i] || 0) > maxVotes) {
                            maxVotes = counts[i] || 0;
                            topIdx = i;
                        }
                    }

                    const feedback = kuisAktif.data.feedbacks[topIdx];
                    const pilihan = kuisAktif.data.options[topIdx];

                    const teksHasil = `📊 *HASIL PILIHAN TERBANYAK KELAS*\n` +
                                      `Pilihan: *${pilihan}* (${maxVotes || 0} suara)\n` +
                                      `━━━━━━━━━━━━━━━━━━━━\n\n` +
                                      `${feedback}\n\n` +
                                      `━━━━━━━━━━━━━━━━━━━━\n` +
                                      `_Respon otomatis jam ${jamRespon}:00_`;

                    await sock.sendMessage(ID_GRUP_TUJUAN, { text: teksHasil });
                    lastResultDate = tglID;
                    kuisAktif.msgId = null;
                } catch (err) { console.error("Feedback Error:", err); }
            }
        }
    }, 35000);
}

// --- SCHEDULER: Jadwal Besok ---
async function initJadwalBesokScheduler(sock) {
    console.log("✅ Scheduler Jadwal Besok Aktif (17:00 WIB)");
    let lastSentJadwal = "";
    setInterval(async () => {
        const now = getWIBDate();
        const jam = now.getHours();
        const menit = now.getMinutes();
        const hariIni = now.getDay(); 
        const tglID = `${now.getDate()}-${now.getMonth()}`;
        
        if (jam === 17 && menit === 0 && lastSentJadwal !== tglID) {
            let hariBesok = (hariIni + 1) % 7;
            if (hariBesok < 1 || hariBesok > 5) return; 
            try {
                const { dates } = getWeekDates();
                const dayLabels = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                const daysKey = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
                
                const jadwalData = JADWAL_PELAJARAN[hariBesok] || "";
                if (!jadwalData) return;

                const rawMapel = jadwalData.split('\n');
                const motivasi = MOTIVASI_SEKOLAH[Math.floor(Math.random() * MOTIVASI_SEKOLAH.length)];
                const currentData = db.getAll() || {};
                const dataPRBesok = (currentData[daysKey[hariBesok]] || "").toLowerCase();

                const jadwalFinal = rawMapel.map(mapel => {
                    const mapelMurni = mapel.replace(/[^\w\s]/gi, '').toLowerCase().trim();
                    const adaPR = dataPRBesok !== "" && !dataPRBesok.includes("tidak ada pr") && dataPRBesok.includes(mapelMurni);
                    return `${mapel} ➝ ${adaPR ? "🔴 ada pr" : "🟢 gak ada pr"}`;
                }).join('\n');

                const formatPesan = `🚀 *PERSIAPAN JADWAL BESOK*\n📅 *${dayLabels[hariBesok].toUpperCase()}, ${dates[hariBesok - 1]}*\n━━━━━━━━━━━━━━━━━━━━\n\n${jadwalFinal}\n\n━━━━━━━━━━━━━━━━━━━━\n💡 _"${motivasi}"_\n\n*Tetap semangat ya!* 😇`;
                await sock.sendMessage(ID_GRUP_TUJUAN, { text: formatPesan });
                lastSentJadwal = tglID;
            } catch (err) { console.error("Jadwal Besok Error:", err); }
        }
    }, 35000); 
}

// --- MESSAGE HANDLER ---
async function handleMessages(sock, m) {
    try {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || "").trim();
        const textLower = body.toLowerCase();
        const isAdmin = ADMIN_RAW.some(admin => sender.includes(admin));
        const nonAdminMsg = "🚫 *AKSES DITOLAK*\n\nMaaf, fitur ini hanya bisa diakses oleh *Pengurus*.";

        if (body === '!reset-bot') {
            if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
            await sock.sendMessage(sender, { text: "⚠️ *MENGHAPUS SESI TOTAL...*\nBot akan restart." });
            await delay(2000); 
            try {
                if (fs.existsSync('./auth_info')) fs.rmSync('./auth_info', { recursive: true, force: true });
            } catch (e) { console.error("Folder EBUSY, mematikan proses saja..."); }
            process.exit(1);
        }

        if (body.startsWith('!')) {
            const cmdInput = body.split(' ')[0].toLowerCase();
            const suggestion = getClosestCommand(cmdInput);
            const validCmds = ['!p', '!pr', '!deadline', '!menu', '!update', '!update_jadwal', '!hapus', '!grup', '!polling', '!info', '!reset-bot'];
            if (!validCmds.includes(cmdInput) && suggestion) {
                return await sock.sendMessage(sender, { text: `🧐 *Perintah tidak dikenal.*\nMungkin maksud Anda: *${suggestion}* ?` });
            }
        } else {
            const triggers = ['p', 'pr', 'menu', 'update', 'update_jadwal', 'hapus', 'grup', 'info', 'deadline', 'polling'];
            const firstWord = textLower.split(' ')[0];
            if (triggers.includes(firstWord)) {
                return await sock.sendMessage(sender, { text: `⚠️ *Format Salah!*\nGunakan tanda seru (*!*) di depan perintah.` });
            }
            if (!sender.endsWith('@g.us')) return await sock.sendMessage(sender, { text: `Halo! Ketik *!menu* untuk bantuan.` });
            return;
        }

        await sock.readMessages([msg.key]);
        const args = body.split(' ');
        const cmd = args[0].toLowerCase();
        const { dates, periode } = getWeekDates();

        const getProcessedTask = (dayKey, input) => {
            const dayMap = { 'senin': 0, 'selasa': 1, 'rabu': 2, 'kamis': 3, 'jumat': 4 };
            const dayLabels = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
            let allData = db.getAll() || {};
            let currentData = allData[dayKey] || "";
            let organized = [];

            STRUKTUR_JADWAL[dayKey].forEach(mKey => {
                const emojiMapel = MAPEL_CONFIG[mKey];
                if (input.toLowerCase().includes(mKey.toLowerCase())) {
                    let parts = input.split(new RegExp(mKey, 'i'));
                    let desc = parts[1] ? parts[1].split(/label:/i)[0].trim() : "";
                    if (desc === "") return;

                    let lbl = LABELS['biasa'];
                    for (let l in LABELS) { if (input.toLowerCase().includes(l.toLowerCase())) { lbl = LABELS[l]; break; } }
                    
                    organized.push(`• ${emojiMapel}\n➝ ${desc}\n--} ${lbl} |\n⏰ Deadline: ${dayLabels[dayMap[dayKey]]}, ${dates[dayMap[dayKey]]}`);
                } else {
                    const sections = currentData.split('\n\n');
                    const exist = sections.find(s => s.includes(emojiMapel));
                    if (exist) organized.push(exist);
                }
            });
            return organized.join('\n\n');
        };

        const formatRekap = () => {
            const currentData = db.getAll() || {};
            let rekap = `📌 *DAFTAR LIST TUGAS PR* 📢\n🗓️ Periode: ${periode}\n`;
            rekap += `\n━━━━━━━━━━━━━━━━━━━━\n\n`;
            const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
            const dayLabels = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
            days.forEach((day, i) => {
                rekap += `📅 *${dayLabels[i]}* (${dates[i]})\n`;
                let tugas = currentData[day];
                if (!tugas || tugas.includes("Tidak ada PR") || tugas === "") {
                    rekap += `└─ ✅ _Tidak ada PR_\n\n`;
                } else { rekap += `${tugas}\n\n`; }
            });
            rekap += `━━━━━━━━━━━━━━━━━━━━\n⏳ *BELUM DIKUMPULKAN:*\n${currentData.deadline || "Semua tugas selesai."}`;
            return rekap;
        };

        const sendToGroupSafe = async (content) => {
            try {
                await sock.sendPresenceUpdate('composing', ID_GRUP_TUJUAN);
                await delay(1500);
                await sock.sendMessage(ID_GRUP_TUJUAN, content);
                return true;
            } catch (err) { return false; }
        };

        switch (cmd) {
            case '!p':
                await sock.sendMessage(sender, { text: '✅ *Bot Aktif!*' });
                break;
            case '!pr':
                await sock.sendMessage(sender, { text: formatRekap() });
                break;
            case '!deadline':
                if (args.length === 1) {
                    const infoDl = (db.getAll() || {}).deadline || "Semua tugas sudah selesai.";
                    await sock.sendMessage(sender, { text: `⏳ *DAFTAR TUGAS BELUM DIKUMPULKAN*\n\n${infoDl}` });
                } else {
                    if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
                    db.updateTugas('deadline', body.slice(10).trim());
                    await sock.sendMessage(sender, { text: `✅ Deadline diperbarui!` });
                }
                break;
            case '!menu':
                const menu = `📖 *MENU BOT TUGAS*\n\n*PENGGUNA:* \n🔹 !p, !pr, !deadline\n\n*PENGURUS:* \n🔸 !update [hari] [mapel] [tugas]\n🔸 !update_jadwal\n🔸 !hapus [hari] [mapel]\n🔸 !grup, !polling, !info`;
                await sock.sendMessage(sender, { text: menu });
                break;
            case '!polling':
                if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
                const nowWIB = getWIBDate();
                const hNow = nowWIB.getDay();
                const pool = QUIZ_BANK[hNow] || QUIZ_BANK[1];
                const q = pool[Math.floor(Math.random() * pool.length)];
                const sMsg = await sock.sendMessage(ID_GRUP_TUJUAN, {
                    poll: { name: `📊 *POLLING*\n${q.question}`, values: q.options, selectableCount: 1 }
                });
                kuisAktif = { msgId: sMsg.key.id, data: q, votes: {} };
                break;
            case '!info':
                if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
                const infoMsg = body.slice(6).trim();
                if (infoMsg) {
                    await sendToGroupSafe({ text: `📢 *PENGUMUMAN*\n\n${infoMsg}\n\n_— Pengurus_` });
                    await sock.sendMessage(sender, { text: '✅ Terkirim.' });
                }
                break;
            case '!grup':
                if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
                await sendToGroupSafe({ text: formatRekap() });
                await sock.sendMessage(sender, { text: '✅ Rekap terkirim.' });
                break;
            case '!update':
            case '!update_jadwal':
                if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
                const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
                const dayLabels = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
                let dayIdx = days.findIndex(day => textLower.includes(day));
                if (dayIdx === -1) return await sock.sendMessage(sender, { text: "❌ *HARI TIDAK DITEMUKAN*" });
                let targetDayUpdate = days[dayIdx];
                const mapelDitemukan = STRUKTUR_JADWAL[targetDayUpdate].find(m => textLower.includes(m.toLowerCase()));
                if (!mapelDitemukan) return await sock.sendMessage(sender, { text: `❌ *MAPEL SALAH/TYPO*` });
                let resultUpdate = getProcessedTask(targetDayUpdate, body);
                db.updateTugas(targetDayUpdate, resultUpdate);
                if (cmd === '!update') {
                    const pesanGrup = `📌 *UPDATE TUGAS* 📢\n\n*📅 ${dayLabels[dayIdx]}* (${dates[dayIdx]})\n\n${resultUpdate}`;
                    await sendToGroupSafe({ text: pesanGrup });
                }
                await sock.sendMessage(sender, { text: `✅ Berhasil Update *${mapelDitemukan.toUpperCase()}*!` });
                break;
            case '!hapus':
                if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
                const targetKeyHapus = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'deadline'].find(key => textLower.includes(key));
                if (!targetKeyHapus) return await sock.sendMessage(sender, { text: "❌ *Pilih hari!*" });
                if (targetKeyHapus !== 'deadline') {
                    const targetMapel = Object.keys(MAPEL_CONFIG).find(m => textLower.includes(m.toLowerCase()));
                    if (targetMapel) {
                        let current = (db.getAll() || {})[targetKeyHapus] || "";
                        let filtered = current.split('\n\n').filter(s => !s.includes(MAPEL_CONFIG[targetMapel])).join('\n\n');
                        db.updateTugas(targetKeyHapus, filtered || "└─ ✅ _Tidak ada PR_");
                        await sock.sendMessage(sender, { text: `✅ Tugas *${targetMapel}* dihapus.` });
                    } else {
                        db.updateTugas(targetKeyHapus, "└─ ✅ _Tidak ada PR_");
                        await sock.sendMessage(sender, { text: `✅ Data hari ${targetKeyHapus} dibersihkan.` });
                    }
                } else {
                    db.updateTugas('deadline', "Semua tugas sudah selesai.");
                    await sock.sendMessage(sender, { text: `✅ Deadline dibersihkan.` });
                }
                break;
        }
    } catch (err) { console.error("CRITICAL ERROR:", err); }
}

module.exports = { handleMessages, initQuizScheduler, initJadwalBesokScheduler, initSmartFeedbackScheduler, kuisAktif };
