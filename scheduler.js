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
                        poll: {
                            name: `🕒 *PULANG SEKOLAH CHECK*\n${randomQuiz.question}`,
                            values: randomQuiz.options,
                            selectableCount: 1
                        }
                    });
                    kuisAktif.msgId = sentMsg.key.id;
                    kuisAktif.data = randomQuiz;
                    kuisAktif.votes = {};
                    kuisAktif.targetJam = (hariAngka === 5 ? 13 : 16);
                    kuisAktif.tglID = tglID;
                    lastSentDate = tglID; 
                }
            } catch (err) { console.error("Quiz Scheduler Error:", err); }
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
                if (votesArray.length === 0) {
                    lastProcessedId = kuisAktif.msgId;
                    kuisAktif.msgId = null;
                    return;
                }
                const counts = {};
                votesArray.forEach(v => { counts[v[0]] = (counts[v[0]] || 0) + 1; });
                let topIdx = -1; let maxVotes = 0;
                for (let i = 0; i < kuisAktif.data.options.length; i++) {
                    if ((counts[i] || 0) > maxVotes) { maxVotes = counts[i] || 0; topIdx = i; }
                }
                if (topIdx !== -1) {
                    const feedback = kuisAktif.data.feedbacks[topIdx];
                    const pilihan = kuisAktif.data.options[topIdx];
                    const teksHasil = `📊 *HASIL PILIHAN TERBANYAK KELAS*\n` +
                                      `Pilihan: *${pilihan}* (${maxVotes} suara)\n` +
                                      `━━━━━━━━━━━━━━━━━━━━\n\n` +
                                      `${feedback}\n\n` +
                                      `━━━━━━━━━━━━━━━━━━━━\n` +
                                      `_Respon otomatis jam ${jamSekarang}:00_`;
                    await sock.sendMessage(ID_GRUP_TUJUAN, { text: teksHasil });
                }
                lastProcessedId = kuisAktif.msgId;
                kuisAktif.msgId = null;
            } catch (err) { console.error("Feedback Scheduler Error:", err); }
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
        const hariIni = now.getDay(); 
        const tglID = `${now.getDate()}-${now.getMonth()}`;
        if (jam === 17 && menit === 0 && lastSentJadwal !== tglID) {
            let hariBesok = (hariIni + 1) % 7;
            if (hariBesok < 1 || hariBesok > 5) return; 
            try {
                const { dates } = getWeekDates();
                const dayLabels = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                const daysKey = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
                const rawMapel = JADWAL_PELAJARAN[hariBesok].split('\n');
                const motivasi = MOTIVASI_SEKOLAH[Math.floor(Math.random() * MOTIVASI_SEKOLAH.length)];
                const currentData = db.getAll() || {};
                const dataPRBesok = (currentData[daysKey[hariBesok]] || "").toLowerCase();
                const jadwalFinal = rawMapel.map(mapel => {
                    const mapelMurni = mapel.replace(/[^\w\s]/gi, '').toLowerCase().trim();
                    const adaPR = dataPRBesok !== "" && !dataPRBesok.includes("belum ada tugas") && dataPRBesok.includes(mapelMurni);
                    return `${mapel} ➝ ${adaPR ? "ada pr" : "gak ada pr"}`;
                }).join('\n');
                const formatPesan = `🚀 *PERSIAPAN JADWAL BESOK*\n📅 *${dayLabels[hariBesok].toUpperCase()}, ${dates[hariBesok - 1]}*\n━━━━━━━━━━━━━━━━━━━━\n\n${jadwalFinal}\n\n━━━━━━━━━━━━━━━━━━━━\n💡 _"${motivasi}"_\n\n*Tetap semangat ya!* 😇`;
                await sock.sendMessage(ID_GRUP_TUJUAN, { text: formatPesan });
                lastSentJadwal = tglID;
            } catch (err) { console.error("Jadwal Besok Error:", err); }
        }
    }, 35000); 
}

module.exports = { initQuizScheduler, initSmartFeedbackScheduler, initJadwalBesokScheduler, getWeekDates };
