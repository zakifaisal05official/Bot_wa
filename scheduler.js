const { QUIZ_BANK } = require('./quiz'); 
const { JADWAL_PELAJARAN, MOTIVASI_SEKOLAH } = require('./constants');
const db = require('./data');
const fs = require('fs'); 

const ID_GRUP_TUJUAN = '120363403625197368@g.us'; 
const KUIS_PATH = '/app/auth_info'; // Path disesuaikan ke volume agar tidak reset

function getWIBDate() {
    return new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
}

function getWeekDates() {
    const now = getWIBDate();
    const dayOfWeek = now.getDay(); 
    const monday = new Date(now);

    if (dayOfWeek === 6) { 
        monday.setDate(now.getDate() + 2); 
    } else if (dayOfWeek === 0) { 
        monday.setDate(now.getDate() + 1); 
    } else {
        const diffToMonday = 1 - dayOfWeek;
        monday.setDate(now.getDate() + diffToMonday);
    }
    
    const dates = [];
    for (let i = 0; i < 5; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        dates.push(`${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`);
    }
    const periode = `${dates[0]} - ${dates[4]}`;
    return { dates, periode };
}

async function initSahurScheduler(sock, botConfig) {
    console.log("✅ Scheduler Sahur Aktif (04:00 WIB)");
    let lastSentSahur = "";
    setInterval(async () => {
        if (!botConfig.sahur) return; // Cek fitur ON/OFF
        const now = getWIBDate();
        const jam = now.getHours();
        const menit = now.getMinutes();
        const tglID = `${now.getDate()}-${now.getMonth()}`;
        
        if (jam === 4 && menit === 0 && lastSentSahur !== tglID) {
            try {
                const pesanSahur = `🌙 *REMINDER SAHUR* 🕌\n━━━━━━━━━━━━━━━━━━━━\n\nSelamat makan sahur semuanya! Jangan lupa niat puasa dan perbanyak minum air putih ya.\n\n_🕒 Waktu: 04:00 WIB (Sebelum Subuh)_\n\n━━━━━━━━━━━━━━━━━━━━\n*Semoga puasanya lancar!* ✨`;
                await sock.sendMessage(ID_GRUP_TUJUAN, { text: pesanSahur });
                lastSentSahur = tglID;
            } catch (err) { console.error("Sahur Error:", err); }
        }
    }, 35000);
}

async function sendJadwalBesokManual(sock, targetJid) {
    try {
        const now = getWIBDate();
        const hariIni = now.getDay(); 
        if (hariIni === 5 || hariIni === 6) return;

        let hariBesok = (hariIni + 1) % 7;
        if (hariBesok === 0) hariBesok = 1;

        const { dates } = getWeekDates();
        const dayLabels = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const daysKey = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
        
        const rawMapel = JADWAL_PELAJARAN[hariBesok].split('\n');
        const motivasi = MOTIVASI_SEKOLAH[Math.floor(Math.random() * MOTIVASI_SEKOLAH.length)];
        const currentData = db.getAll() || {};
        const dataPRBesok = (currentData[daysKey[hariBesok]] || "");
        const tglBesok = dates[hariBesok - 1];

        let teksPR = `📌 *DAFTAR LIST TUGAS PR* 📢\n📅 Hari: ${dayLabels[hariBesok].toUpperCase()} (${tglBesok})\n\n━━━━━━━━━━━━━━━━━━━━\n\n`;
        if (!dataPRBesok || dataPRBesok === "" || dataPRBesok.includes("Belum ada tugas") || dataPRBesok.includes("Tidak ada PR")) {
            teksPR += `└─ ✅ _Tidak ada PR_\n\n`;
        } else {
            let updatedTugas = dataPRBesok.replace(/⏰ Deadline: .*/g, `⏰ Deadline: ${dayLabels[hariBesok].charAt(0) + dayLabels[hariBesok].slice(1).toLowerCase()}, ${tglBesok}`);
            teksPR += `${updatedTugas}\n\n`;
        }
        teksPR += `━━━━━━━━━━━━━━━━━━━━\n⚠️ *Salah list tugas?*\nHubungi nomor: *089531549103*`;

        await sock.sendMessage(targetJid || ID_GRUP_TUJUAN, { text: teksPR });
        await new Promise(resolve => setTimeout(resolve, 5000));

        const jadwalFinal = rawMapel.map(mapel => {
            const emojiOnly = mapel.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}]/u);
            let adaPR = false;
            if (dataPRBesok !== "" && !dataPRBesok.includes("belum ada tugas") && emojiOnly) {
                adaPR = dataPRBesok.includes(emojiOnly[0]);
            }
            return `${mapel} ➝ ${adaPR ? "ada pr" : "gak ada pr"}`;
        }).join('\n');

        const formatPesan = `🚀 *PERSIAPAN JADWAL BESOK*\n📅 *${dayLabels[hariBesok].toUpperCase()}, ${tglBesok}*\n━━━━━━━━━━━━━━━━━━━━\n\n${jadwalFinal}\n\n━━━━━━━━━━━━━━━━━━━━\n💡 _"${motivasi}"_\n\n*Tetap semangat ya!* 😇`;
        await sock.sendMessage(targetJid || ID_GRUP_TUJUAN, { text: formatPesan });
    } catch (err) { console.error("Jadwal Manual Error:", err); }
}

async function initListPrMingguanScheduler(sock, botConfig) {
    console.log("✅ Scheduler List PR Mingguan Aktif (Sabtu 10:00 WIB)");
    let lastSentList = "";
    setInterval(async () => {
        if (!botConfig.prMingguan) return; // Cek fitur ON/OFF
        const now = getWIBDate();
        const hariIni = now.getDay();
        const jam = now.getHours();
        const menit = now.getMinutes();
        const tglID = `${now.getDate()}-${now.getMonth()}`;
        
        if (hariIni === 6 && jam === 10 && menit === 0 && lastSentList !== tglID) {
            try {
                const { dates, periode } = getWeekDates();
                const daysKey = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
                const dayLabels = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'];
                const currentData = db.getAll() || {};
                
                let teksPesan = `📌 *DAFTAR LIST TUGAS PR* 📢\n🗓️ Periode: ${periode}\n\n━━━━━━━━━━━━━━━━━━━━\n\n`;
                for (let i = 0; i < 5; i++) {
                    const hariKey = daysKey[i];
                    teksPesan += `📅 *${dayLabels[i]}* (${dates[i]})\n`;
                    let tugas = currentData[hariKey];
                    if (!tugas || tugas === "" || tugas.includes("Belum ada tugas") || tugas.includes("Tidak ada PR")) {
                        teksPesan += `└─ ✅ _Tidak ada PR_\n\n`;
                    } else {
                        let updatedTugas = tugas.replace(/⏰ Deadline: .*/g, `⏰ Deadline: ${dayLabels[i].charAt(0) + dayLabels[i].slice(1).toLowerCase()}, ${dates[i]}`);
                        teksPesan += `${updatedTugas}\n\n`;
                    }
                }
                teksPesan += `━━━━━━━━━━━━━━━━━━━━\n⏳ *DAFTAR TUGAS BELUM DIKUMPULKAN:*\n${currentData.deadline || "Semua tugas sudah selesai."}\n\n⚠️ *Salah list tugas?*\nHubungi nomor: *089531549103*`;
                await sock.sendMessage(ID_GRUP_TUJUAN, { text: teksPesan });
                lastSentList = tglID;
            } catch (err) { console.error("List PR Mingguan Error:", err); }
        }
    }, 35000);
}

async function initQuizScheduler(sock, botConfig) {
    console.log("✅ Scheduler Polling Aktif (Sen-Jum 13:00 WIB)");
    let lastSentDate = ""; 
    const kuisAktif = { msgId: null, data: null, votes: {}, targetJam: null, tglID: null };
    
    setInterval(async () => {
        if (!botConfig.quiz) return; // Cek fitur ON/OFF
        const now = getWIBDate();
        const jam = now.getHours();
        const menit = now.getMinutes();
        const tgl = now.getDate();
        const bln = now.getMonth() + 1;
        const hariAngka = now.getDay(); 
        const tglID = `${tgl}-${now.getMonth()}`;

        if (jam === 13 && menit === 0 && hariAngka >= 1 && hariAngka <= 5 && lastSentDate !== tglID) {
            try {
                let fase = 0;
                if (tgl >= 18 && tgl <= 21 && bln === 2) fase = 1; 
                else if (tgl >= 24 && tgl <= 26 && bln === 2) fase = 2; 
                else if ((tgl >= 27 && bln === 2) || (tgl <= 4 && bln === 3)) fase = 3; 
                else if (tgl >= 9 && tgl <= 14 && bln === 3) fase = 4; 
                else if (tgl >= 16 && tgl <= 27 && bln === 3) fase = 5; 

                const kuisHariIni = QUIZ_BANK[fase];
                if (kuisHariIni && kuisHariIni.length > 0) {
                    const randomQuiz = kuisHariIni[Math.floor(Math.random() * kuisHariIni.length)];
                    const sentMsg = await sock.sendMessage(ID_GRUP_TUJUAN, {
                        poll: { name: `🕒 *PULANG SEKOLAH CHECK*\n${randomQuiz.question}`, values: randomQuiz.options, selectableCount: 1 }
                    });
                    kuisAktif.msgId = sentMsg.key.id;
                    kuisAktif.data = randomQuiz;
                    kuisAktif.votes = {}; 
                    kuisAktif.targetJam = 15; 
                    kuisAktif.tglID = tglID;
                    lastSentDate = tglID; 
                    fs.writeFileSync(KUIS_PATH, JSON.stringify(kuisAktif, null, 2));
                }
            } catch (err) { console.error("Quiz Error:", err); }
        }
    }, 35000);
}

async function initSmartFeedbackScheduler(sock, botConfig) {
    console.log("✅ Scheduler Smart Feedback Aktif");
    let lastProcessedId = "";
    setInterval(async () => {
        if (!botConfig.smartFeedback) return; // Cek fitur ON/OFF
        let kuisAktif = {};
        if (fs.existsSync(KUIS_PATH)) kuisAktif = JSON.parse(fs.readFileSync(KUIS_PATH, 'utf-8'));
        
        const now = getWIBDate();
        const jamSekarang = now.getHours();
        const tglSekarang = `${now.getDate()}-${now.getMonth()}`;
        
        if (kuisAktif.msgId && kuisAktif.data && kuisAktif.targetJam === jamSekarang && kuisAktif.tglID === tglSekarang) {
            if (lastProcessedId === kuisAktif.msgId) return;
            try {
                const votesArray = Object.values(kuisAktif.votes || {});
                let topIdx = 0; let maxVotes = 0;
                if (votesArray.length > 0) {
                    const counts = {};
                    votesArray.forEach(v => { if (Array.isArray(v)) v.forEach(opt => { counts[opt] = (counts[opt] || 0) + 1; }); });
                    for (let i = 0; i < kuisAktif.data.options.length; i++) {
                        let currentCount = counts[i] || 0;
                        if (currentCount > maxVotes) { maxVotes = currentCount; topIdx = i; }
                    }
                }
                const teksHasil = `📊 *HASIL PILIHAN TERBANYAK KELAS*\nPilihan: *${kuisAktif.data.options[topIdx]}* (${maxVotes} suara)\n━━━━━━━━━━━━━━━━━━━━\n\n${kuisAktif.data.feedbacks[topIdx]}\n\n━━━━━━━━━━━━━━━━━━━━\n_Respon otomatis jam ${jamSekarang}:00_`;
                await sock.sendMessage(ID_GRUP_TUJUAN, { text: teksHasil });
                lastProcessedId = kuisAktif.msgId;
                if (fs.existsSync(KUIS_PATH)) fs.unlinkSync(KUIS_PATH);
            } catch (err) { console.error("Feedback Error:", err); }
        }
    }, 35000);
}

async function initJadwalBesokScheduler(sock, botConfig) {
    console.log("✅ Scheduler Jadwal Besok Aktif (17:00 WIB)");
    let lastSentJadwal = "";
    setInterval(async () => {
        if (!botConfig.jadwalBesok) return; // Cek fitur ON/OFF
        const now = getWIBDate();
        const jam = now.getHours();
        const menit = now.getMinutes();
        const tglID = `${now.getDate()}-${now.getMonth()}`;
        if (jam === 17 && menit === 0 && lastSentJadwal !== tglID) {
            await sendJadwalBesokManual(sock);
            lastSentJadwal = tglID;
        }
    }, 35000); 
}

module.exports = { 
    initQuizScheduler, 
    initSmartFeedbackScheduler, 
    initJadwalBesokScheduler, 
    initListPrMingguanScheduler, 
    initSahurScheduler,
    getWeekDates,
    sendJadwalBesokManual
};
        
