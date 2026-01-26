const db = require('./data');
const { delay } = require("@whiskeysockets/baileys");
const fs = require('fs');
const { QUIZ_BANK } = require('./quiz'); 

// ================= CONFIG =================
const ADMIN_RAW = ['6289531549103', '171425214255294', '6285158738155']; 
const ID_GRUP_TUJUAN = '120363403625197368@g.us'; 

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

// --- SCHEDULER: DINONAKTIFKAN ---
async function initQuizScheduler(sock) {
    // Kosong: Tidak akan mengirim polling otomatis ke grup lagi
    console.log("✅ Scheduler dinonaktifkan (Tidak akan kirim ke grup).");
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

        // --- 2. FITUR EDUKASI FORMAT ---
        const triggers = ['p', 'pr', 'menu', 'update', 'hapus', 'grup', 'info', 'deadline', 'polling'];
        const firstWord = textLower.split(' ')[0];
        
        if (!body.startsWith('!') && triggers.includes(firstWord)) {
            return await sock.sendMessage(sender, { text: `⚠️ *Format Salah!*\nGunakan tanda seru (*!*) di depan perintah.` });
        }

        if (!body.startsWith('!')) return;

        await sock.readMessages([msg.key]);

        const args = body.split(' ');
        const cmd = args[0].toLowerCase();
        const { dates, periode } = getWeekDates();

        // Rekap Generator
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
            rekap += `━━━━━━━━━━━━━━━━━━━━\n⏳ *DEADLINE:*\n${currentData.deadline || "Belum ada info."}`;
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
                await sock.sendMessage(sender, { text: '✅ *Bot Aktif!*' });
                break;

            case '!pr':
                await sock.sendMessage(sender, { text: formatRekap() });
                break;

            case '!menu':
                const menu = `📖 *MENU BOT*\n\n🔹 !pr - List Tugas\n🔹 !deadline - Info Deadline\n🔹 !polling - Polling (Private)\n\n*ADMIN:* !update, !hapus, !grup, !info`;
                await sock.sendMessage(sender, { text: menu });
                break;

            case '!polling':
                // SEKARANG HANYA KIRIM KE PRIBADI
                let random = QUIZ_BANK[Math.floor(Math.random() * QUIZ_BANK.length)];
                await sock.sendMessage(sender, {
                    poll: { name: `📊 *POLLING (Private)*\n${random.question}`, values: random.options, selectableCount: 1 }
                });
                break;

            case '!deadline':
                if (args.length === 1) {
                    await sock.sendMessage(sender, { text: `⏳ *INFO DEADLINE*\n\n${db.getAll().deadline}` });
                } else if (isAdmin) {
                    db.updateTugas('deadline', body.slice(10).trim());
                    await sock.sendMessage(sender, { text: `✅ Deadline diperbarui.` });
                }
                break;

            case '!info':
            case '!grup':
            case '!update':
            case '!hapus':
                if (!isAdmin) return;

                if (cmd === '!info') {
                    const infoMsg = body.slice(6).trim();
                    if (infoMsg) await sendToGroupSafe({ text: `📢 *PENGUMUMAN*\n\n${infoMsg}` });
                    await sock.sendMessage(sender, { text: '✅ Info terkirim ke grup.' });
                }

                if (cmd === '!grup') {
                    await sendToGroupSafe({ text: formatRekap() });
                    await sock.sendMessage(sender, { text: '✅ Rekap terkirim ke grup.' });
                }

                if (cmd === '!update') {
                    const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
                    let targetDay = days.find(day => textLower.includes(day));
                    if (targetDay) {
                        let content = body.replace(/!update/i, '').replace(new RegExp(targetDay, 'gi'), '').trim();
                        db.updateTugas(targetDay, content);
                        // HANYA BALAS KE ADMIN, TIDAK KIRIM KE GRUP
                        await sock.sendMessage(sender, { text: `✅ Berhasil update data *${targetDay}*. (Tidak dikirim ke grup)` });
                    }
                }

                if (cmd === '!hapus') {
                    let targetKey = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'deadline'].find(key => textLower.includes(key));
                    if (targetKey) {
                        db.updateTugas(targetKey, "Belum ada tugas.");
                        await sock.sendMessage(sender, { text: `✅ Data ${targetKey} dihapus.` });
                    }
                }
                break;
        }
    } catch (err) { console.error(err); }
}

module.exports = { handleMessages, initQuizScheduler };
