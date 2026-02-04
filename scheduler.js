const { QUIZ_BANK } = require('./quiz'); 
const { JADWAL_PELAJARAN, MOTIVASI_SEKOLAH } = require('./constants');
const db = require('./data');

const ID_GRUP_TUJUAN = '120363403625197368@g.us'; 

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

async function sendJadwalBesokManual(sock, targetJid) {
    try {
        const now = getWIBDate();
        const hariIni = now.getDay(); 
        let hariBesok = (hariIni + 1) % 7;
        
        if (hariBesok === 6 || hariBesok === 0) {
            hariBesok = 1; 
        }

        const { dates } = getWeekDates();
        const dayLabels = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const daysKey = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
        
        const rawMapel = JADWAL_PELAJARAN[hariBesok].split('\n');
        const motivasi = MOTIVASI_SEKOLAH[Math.floor(Math.random() * MOTIVASI_SEKOLAH.length)];
        const currentData = db.getAll() || {};
        const dataPRBesok = (currentData[daysKey[hariBesok]] || "");

        const jadwalFinal = rawMapel.map(mapel => {
            // Ambil EMOJI dari jadwal (misal: 🕌 atau 🔬)
            const emojiOnly = mapel.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}]/u);
            
            let adaPR = false;
            if (dataPRBesok !== "" && !dataPRBesok.includes("belum ada tugas") && emojiOnly) {
                // Cek apakah emoji tersebut ada di dalam teks database PR
                adaPR = dataPRBesok.includes(emojiOnly[0]);
            }

            return `${mapel} ➝ ${adaPR ? "ada pr" : "gak ada pr"}`;
        }).join('\n');

        const formatPesan = `🚀 *PERSIAPAN JADWAL BESOK*\n📅 *${dayLabels[hariBesok].toUpperCase()}, ${dates[hariBesok - 1]}*\n━━━━━━━━━━━━━━━━━━━━\n\n${jadwalFinal}\n\n━━━━━━━━━━━━━━━━━━━━\n💡 _"${motivasi}"_\n\n*Tetap semangat ya!* 😇`;
        
        // Kirim ke Japri jika ada targetJid, jika tidak ke grup
        await sock.sendMessage(targetJid || ID_GRUP_TUJUAN, { text: formatPesan });
    } catch (err) { console.error("Jadwal Manual Error:", err); }
}

async function initListPrMingguanScheduler(sock) {
    console.log("✅ Scheduler List PR Mingguan Aktif (Sabtu 10:00 WIB)");
    let lastSentList = "";
    setInterval(async () => {
        const now = getWIBDate();
        const hariIni = now.getDay();
        const jam = now.getHours();
        const menit = now.getMinutes();
        const tglID = `${now.getDate()}-${now.getMonth()}`;
        if (hariIni === 6 && jam === 10 && menit === 0 && lastSentList !== tglID) {
            try {
                const { dates, periode } = getWeekDates();
                const daysKey = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
                const dayLabels = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
                const currentData = db.getAll() || {};
                let teksPesan = `📅 *JADWAL & PR MINGGU DEPAN*\nPeriode: *${periode}*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
                for (let i = 1; i <= 5; i++) {
                    const rawMapel = JADWAL_PELAJARAN[i].split('\n');
                    const dataPRHariIni = (currentData[daysKey[i]] || "");
                    
                    teksPesan += `📌 *${dayLabels[i]}, ${dates[i-1]}*\n`;
                    const listMapel = rawMapel.map(mapel => {
                        const emojiOnly = mapel.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}]/u);
                        const adaPR = dataPRHariIni !== "" && !dataPRHariIni.includes("belum ada tugas") && emojiOnly && dataPRHariIni.includes(emojiOnly[0]);
                        return `• ${mapel} ➝ ${adaPR ? "ada pr" : "gak ada pr"}`;
                    }).join('\n');
                    
                    teksPesan += `${listMapel}\n\n`;
                }
                teksPesan += `━━━━━━━━━━━━━━━━━━━━\n💡 _"${MOTIVASI_SEKOLAH[Math.floor(Math.random() * MOTIVASI_SEKOLAH.length)]}"_\n\n*Selamat beristirahat & tetap semangat!*`;
                await sock.sendMessage(ID_GRUP_TUJUAN, { text: teksPesan });
                lastSentList = tglID;
            } catch (err) { console.error("List PR Mingguan Error:", err); }
        }
    }, 35000);
}

async function initQuizScheduler(sock, kuisAktif) {
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
                        poll: { name: `🕒 *PULANG SEKOLAH CHECK*\n${randomQuiz.question}`, values: randomQuiz.options, selectableCount: 1 }
                    });
                    kuisAktif.msgId = sentMsg.key.id;
                    kuisAktif.data = randomQuiz;
                    kuisAktif.votes = {};
                    kuisAktif.targetJam = (hariAngka === 5 ? 13 : 16);
                    kuisAktif.expiresAt = Date.now() + (2 * 60 * 60 * 1000); // Aktif 2 jam
                    kuisAktif.tglID = tglID;
                    lastSentDate = tglID; 
                }
            } catch (err) { console.error("Quiz Error:", err); }
        }
    }, 35000);
}

async function initSmartFeedbackScheduler(sock, kuisAktif) {
    console.log("✅ Scheduler Smart Feedback Aktif");
    let lastProcessedId = "";
    setInterval(async () => {
        const now = getWIBDate();
        const jamSekarang = now.getHours();
        const tglSekarang = `${now.getDate()}-${now.getMonth()}`;
        if (kuisAktif.msgId && kuisAktif.data && kuisAktif.targetJam === jamSekarang && kuisAktif.tglID === tglSekarang) {
            if (lastProcessedId === kuisAktif.msgId) return;
            try {
                const votesArray = Object.values(kuisAktif.votes);
                if (votesArray.length === 0) { lastProcessedId = kuisAktif.msgId; kuisAktif.msgId = null; return; }
                const counts = {};
                votesArray.forEach(v => { counts[v[0]] = (counts[v[0]] || 0) + 1; });
                let topIdx = -1; let maxVotes = 0;
                for (let i = 0; i < kuisAktif.data.options.length; i++) {
                    if ((counts[i] || 0) > maxVotes) { maxVotes = counts[i] || 0; topIdx = i; }
                }
                if (topIdx !== -1) {
                    const teksHasil = `📊 *HASIL PILIHAN TERBANYAK KELAS*\nPilihan: *${kuisAktif.data.options[topIdx]}* (${maxVotes} suara)\n━━━━━━━━━━━━━━━━━━━━\n\n${kuisAktif.data.feedbacks[topIdx]}\n\n━━━━━━━━━━━━━━━━━━━━\n_Respon otomatis jam ${jamSekarang}:00_`;
                    await sock.sendMessage(ID_GRUP_TUJUAN, { text: teksHasil });
                }
                lastProcessedId = kuisAktif.msgId;
                kuisAktif.msgId = null;
            } catch (err) { console.error("Feedback Error:", err); }
        }
    }, 40000);
}

async function initJadwalBesokScheduler(sock) {
    console.log("✅ Scheduler Jadwal Besok Aktif (17:00 WIB)");
    let lastSentJadwal = "";
    setInterval(async () => {
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
    getWeekDates,
    sendJadwalBesokManual
};
    
