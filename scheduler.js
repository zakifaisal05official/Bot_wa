const { QUIZ_BANK } = require('./quiz'); 
const { JADWAL_PELAJARAN, MOTIVASI_SEKOLAH } = require('./constants');
const db = require('./data');
const fs = require('fs'); 

const ID_GRUP_TUJUAN = '120363403625197368@g.us'; 
const KUIS_PATH = './kuis.json';

function getWIBDate() {
    return new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
}

// FUNGSI INI DIPERBAIKI: Agar selalu menunjuk ke Senin depan jika dipanggil Sabtu/Minggu
function getWeekDates() {
    const now = getWIBDate();
    const dayOfWeek = now.getDay(); 
    const monday = new Date(now);

    // Jika hari ini Sabtu (6) atau Minggu (0), kita siapkan untuk MINGGU DEPAN
    if (dayOfWeek === 6) { 
        monday.setDate(now.getDate() + 2); 
    } else if (dayOfWeek === 0) { 
        monday.setDate(now.getDate() + 1); 
    } else {
        // Jika di hari kerja, tetap di minggu ini
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
        
        // PERBAIKAN: Jangan kirim jika besok adalah hari libur (Sabtu/Minggu)
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

        const jadwalFinal = rawMapel.map(mapel => {
            const emojiOnly = mapel.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}]/u);
            let adaPR = false;
            if (dataPRBesok !== "" && !dataPRBesok.includes("belum ada tugas") && emojiOnly) {
                adaPR = dataPRBesok.includes(emojiOnly[0]);
            }
            return `${mapel} ➝ ${adaPR ? "ada pr" : "gak ada pr"}`;
        }).join('\n');

        const formatPesan = `🚀 *PERSIAPAN JADWAL BESOK*\n📅 *${dayLabels[hariBesok].toUpperCase()}, ${dates[hariBesok - 1]}*\n━━━━━━━━━━━━━━━━━━━━\n\n${jadwalFinal}\n\n━━━━━━━━━━━━━━━━━━━━\n💡 _"${motivasi}"_\n\n*Tetap semangat ya!* 😇`;
        
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
                    kuisAktif.tglID = tglID;
                    lastSentDate = tglID; 

                    fs.writeFileSync(KUIS_PATH, JSON.stringify(kuisAktif, null, 2));
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
                // AMBIL DATA VOTE DARI GRUP
                const votesArray = Object.values(kuisAktif.votes || {});
                let topIdx = 0; 
                let maxVotes = 0;

                // CEK DAN BANDINGKAN SUARA TERBANYAK
                if (votesArray.length > 0) {
                    const counts = {};
                    votesArray.forEach(v => { 
                        if (Array.isArray(v)) {
                            v.forEach(opt => {
                                counts[opt] = (counts[opt] || 0) + 1;
                            });
                        }
                    });
                    
                    // Looping semua opsi untuk mencari peraih suara tertinggi
                    for (let i = 0; i < kuisAktif.data.options.length; i++) {
                        let currentCount = counts[i] || 0;
                        if (currentCount > maxVotes) { 
                            maxVotes = currentCount; 
                            topIdx = i; 
                        }
                    }
                }

                // Kirim Feedback berdasarkan hasil pengecekan suara terbanyak
                const teksHasil = `📊 *HASIL PILIHAN TERBANYAK KELAS*\nPilihan: *${kuisAktif.data.options[topIdx]}* (${maxVotes} suara)\n━━━━━━━━━━━━━━━━━━━━\n\n${kuisAktif.data.feedbacks[topIdx]}\n\n━━━━━━━━━━━━━━━━━━━━\n_Respon otomatis jam ${jamSekarang}:00_`;
                await sock.sendMessage(ID_GRUP_TUJUAN, { text: teksHasil });
                
                lastProcessedId = kuisAktif.msgId;
                kuisAktif.msgId = null;
                kuisAktif.data = null;
                kuisAktif.votes = {};
                if (fs.existsSync(KUIS_PATH)) fs.unlinkSync(KUIS_PATH);
            } catch (err) { console.error("Feedback Error:", err); }
        }
    }, 35000);
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
    
