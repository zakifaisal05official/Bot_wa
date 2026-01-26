const db = require('./data');
const { delay } = require("@whiskeysockets/baileys");
const fs = require('fs');
const { QUIZ_BANK } = require('./quiz'); 

// ================= CONFIG =================
const ADMIN_RAW = ['6289531549103', '171425214255294', '6285158738155']; 
const ID_GRUP_TUJUAN = '120363403625197368@g.us'; 

// Variabel untuk menyimpan polling pesanan admin (Antrean)
let bookingPollingAdmin = null;

// ================= UTIL: AUTO DATE LOGIC =================
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
    const periode = `${dates[0]} - ${dates[4]}`;
    return { dates, periode };
}

// --- FUNGSI SEARCH SIMILAR (ANTI TYPO) ---
function getClosestCommand(cmd) {
    const commands = ['!p', '!pr', '!menu', '!deadline', '!update', '!hapus', '!grup', '!info', '!polling', '!reset-bot'];
    return commands.find(c => c.includes(cmd) || cmd.includes(c));
}

// ================= SCHEDULER: POLLING 13:00 =================
async function initQuizScheduler(sock) {
    console.log("✅ Scheduler Polling Aktif (13:00)");
    setInterval(async () => {
        const now = new Date();
        const jam = now.getHours();
        const menit = now.getMinutes();
        const hari = now.getDay(); 

        if (jam === 13 && menit === 0 && hari >= 1 && hari <= 5) {
            let finalQuiz;

            // Jika ada bookingan admin, pakai itu. Jika tidak, pakai random.
            if (bookingPollingAdmin) {
                finalQuiz = bookingPollingAdmin;
                bookingPollingAdmin = null; // Reset antrean setelah terpakai
                console.log("📨 Mengirim Polling Pesanan Admin ke Grup.");
            } else {
                finalQuiz = QUIZ_BANK[Math.floor(Math.random() * QUIZ_BANK.length)];
                console.log("📨 Mengirim Polling Random ke Grup.");
            }

            await sock.sendMessage(ID_GRUP_TUJUAN, {
                poll: {
                    name: `🕒 *PULANG SEKOLAH CHECK (9G)*\n${finalQuiz.question}`,
                    values: finalQuiz.options,
                    selectableCount: 1
                }
            });
        }
    }, 60000); 
}

async function handleMessages(sock, m) {
    try {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || "").trim();
        const textLower = body.toLowerCase();
        const isAdmin = ADMIN_RAW.some(admin => sender.includes(admin));

        // --- 1. FITUR EMERGENCY: RESET SESSION ---
        if (body === '!reset-bot' && isAdmin) {
            await sock.sendMessage(sender, { text: "⚠️ *MENGHAPUS SESI TOTAL...*" });
            await delay(2000); 
            fs.rmSync('./auth_info', { recursive: true, force: true });
            process.exit(1);
        }

        // --- 2. FITUR EDUKASI & ANTI TYPO ---
        const triggers = ['p', 'pr', 'menu', 'update', 'hapus', 'grup', 'info', 'deadline', 'polling'];
        const firstWord = textLower.split(' ')[0];
        
        // Cek jika user lupa pakai "!"
        if (!body.startsWith('!') && triggers.includes(firstWord)) {
            return await sock.sendMessage(sender, { text: `⚠️ *Format Salah!*\nGunakan tanda seru (*) di depan perintah.\nContoh: *!${firstWord}*` });
        }

        if (!body.startsWith('!')) {
            if (!sender.endsWith('@g.us')) {
                return await sock.sendMessage(sender, { text: `Halo! Ketik *!menu* untuk bantuan.` });
            }
            return;
        }

        await sock.readMessages([msg.key]);
        const args = body.split(' ');
        const cmd = args[0].toLowerCase();
        const { dates, periode } = getWeekDates();

        // --- CEK TYPO PERINTAH ---
        const validCommands = ['!p', '!pr', '!menu', '!deadline', '!update', '!hapus', '!grup', '!info', '!polling', '!reset-bot'];
        if (!validCommands.includes(cmd)) {
            const saran = getClosestCommand(cmd);
            let typoMsg = `⚠️ *Perintah Tidak Dikenal!*`;
            if (saran) typoMsg += `\n\nMungkin maksud kamu: *${saran}*?`;
            return await sock.sendMessage(sender, { text: typoMsg });
        }

        // --- LOGIKA REKAP PR ---
        const formatRekap = () => {
            const currentData = db.getAll();
            let rekap = `📌 *DAFTAR LIST TUGAS PR* 📢\n🗓️ Periode: ${periode}\n\n━━━━━━━━━━━━━━━━━━━━\n\n`;
            const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
            const dayLabels = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

            days.forEach((day, i) => {
                rekap += `📅 *${dayLabels[i]}* (${dates[i]})\n`;
                let tugas = currentData[day];
                rekap += (!tugas || tugas.includes("Belum ada") || tugas === "") ? `└─ ✅ _Tidak ada PR_\n\n` : `└─ 📝 ${tugas}\n\n`;
            });
            rekap += `━━━━━━━━━━━━━━━━━━━━\n⏳ *DEADLINE:*\n${currentData.deadline || "Kosong."}\n\n_Ketik !pr untuk cek lagi._`;
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

        // --- LOGIKA PERINTAH ---
        switch (cmd) {
            case '!p':
                await sock.sendMessage(sender, { text: '✅ *Bot Online!*' });
                break;

            case '!pr':
                await sock.sendMessage(sender, { text: formatRekap() });
                break;

            case '!menu':
                const menu = `📖 *MENU BOT*\n\n🔹 !pr - Cek Tugas\n🔹 !deadline - Info Kelompok\n\n*KHUSUS PENGURUS:*\n🔸 !polling soal | opsi1 | opsi2\n🔸 !update [hari] [isi]\n🔸 !grup (Kirim rekap ke grup)`;
                await sock.sendMessage(sender, { text: menu });
                break;

            case '!polling':
                if (!isAdmin) return;
                const qText = body.slice(9).trim();
                
                if (qText.includes('|')) {
                    // SISTEM BOOKING: Masuk antrean untuk jam 13:00 besok/nanti
                    const parts = qText.split('|');
                    bookingPollingAdmin = {
                        question: parts[0].trim(),
                        options: parts.slice(1).map(opt => opt.trim())
                    };
                    await sock.sendMessage(sender, { text: `✅ *Polling Disimpan!*\nPolling custom kamu akan dikirim otomatis pada jam 13:00 (Menggantikan polling random).` });
                } else {
                    // Kirim random INSTAN ke grup sekarang
                    const random = QUIZ_BANK[Math.floor(Math.random() * QUIZ_BANK.length)];
                    await sock.sendMessage(ID_GRUP_TUJUAN, {
                        poll: { name: `📊 *POLLING 9G*\n${random.question}`, values: random.options, selectableCount: 1 }
                    });
                    await sock.sendMessage(sender, { text: `✅ Polling random terkirim ke grup.` });
                }
                break;

            case '!deadline':
                if (args.length === 1) {
                    await sock.sendMessage(sender, { text: `⏳ *INFO DEADLINE*\n\n${db.getAll().deadline || "Kosong."}` });
                } else if (isAdmin) {
                    db.updateTugas('deadline', body.slice(10).trim());
                    await sock.sendMessage(sender, { text: `✅ Deadline diperbarui!` });
                }
                break;

            case '!info':
            case '!grup':
            case '!update':
            case '!hapus':
                if (!isAdmin) return;
                if (cmd === '!info') {
                    await sendToGroupSafe({ text: `📢 *INFO*\n\n${body.slice(6).trim()}` });
                    await sock.sendMessage(sender, { text: '✅ Terkirim.' });
                }
                if (cmd === '!grup') {
                    await sendToGroupSafe({ text: formatRekap() });
                    await sock.sendMessage(sender, { text: '✅ Terkirim.' });
                }
                if (cmd === '!update') {
                    const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
                    let targetDay = days.find(day => textLower.includes(day));
                    if (!targetDay) return;
                    db.updateTugas(targetDay, body.replace(/!update/i, '').replace(new RegExp(targetDay, 'gi'), '').trim());
                    await sock.sendMessage(sender, { text: `✅ Data ${targetDay} diupdate.` });
                }
                if (cmd === '!hapus') {
                    let targetKey = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'deadline'].find(key => textLower.includes(key));
                    if (targetKey) {
                        db.updateTugas(targetKey, "Belum ada tugas.");
                        await sock.sendMessage(sender, { text: `✅ Berhasil dihapus.` });
                    }
                }
                break;
        }

    } catch (err) {
        console.error("Handler Error:", err);
    }
}

module.exports = { handleMessages, initQuizScheduler };
