const db = require('./data');
const { delay } = require("@whiskeysockets/baileys");
const fs = require('fs');

// ================= CONFIG =================
const ADMIN_RAW = ['6289531549103', '171425214255294', '6285158738155']; 
const NOMOR_PENGURUS = '089531549103';
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

async function handleMessages(sock, m) {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const sender = msg.key.remoteJid;
    const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || "").trim();
    const textLower = body.toLowerCase();
    const isAdmin = ADMIN_RAW.some(admin => sender.includes(admin));

    // --- 1. FITUR EMERGENCY: RESET SESSION ---
    if (body === '!reset-bot' && isAdmin) {
        await sock.sendMessage(sender, { text: "⚠️ *MENGHAPUS SESI TOTAL...*\nBot akan restart otomatis. Silakan tunggu 1 menit lalu scan ulang QR baru di web." });
        try {
            fs.rmSync('./auth_info', { recursive: true, force: true });
            console.log("Sesi dihapus oleh admin via perintah !reset-bot");
            process.exit(1);
        } catch (e) {
            console.error("Gagal hapus folder:", e);
        }
    }

    // --- 2. FITUR EDUKASI FORMAT (ANTI LUPA !) ---
    const triggers = ['p', 'pr', 'menu', 'update', 'hapus', 'grup', 'info'];
    const firstWord = textLower.split(' ')[0];
    
    if (!body.startsWith('!') && triggers.includes(firstWord)) {
        const pesanEdukasi = `⚠️ *Format Salah!*\n\nUntuk menggunakan bot, gunakan tanda seru (*!*) di depan perintah.\n\n💡 Contoh: Ketik *!menu* atau *!pr*`;
        return await sock.sendMessage(sender, { text: pesanEdukasi });
    }

    if (!body.startsWith('!')) return;

    const args = body.split(' ');
    const cmd = args[0].toLowerCase();
    const currentData = db.getAll();
    const { dates, periode } = getWeekDates();

    // Template Rekap
    const formatRekap = () => {
        let rekap = `📌 *Daftar List Tugas PR Minggu Ini* 📢\n➝ ${periode}\n\n`;
        rekap += `_________________________________\n\n`;
        const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
        const dayLabels = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

        days.forEach((day, i) => {
            rekap += `📅 *${dayLabels[i]}* ➝ ${dates[i]}\n`;
            let tugas = currentData[day];
            if (!tugas || tugas === "Belum ada tugas." || tugas === "") {
                rekap += `➝ (Tidak ada PR)\n╰───➤ 👍\n\n`;
            } else {
                rekap += `➝ ${tugas}\n\n`;
            }
        });
        rekap += `_________________________________\n\n*semangat menyelesaikan tugasnya! 🚀*`;
        return rekap;
    };

    // --- FUNGSI PENGIRIMAN GRUP STABIL ---
    const sendToGroupSafe = async (content) => {
        try {
            await sock.groupMetadata(ID_GRUP_TUJUAN);
            await sock.sendPresenceUpdate('composing', ID_GRUP_TUJUAN);
            await delay(3000); 
            
            await sock.sendMessage(ID_GRUP_TUJUAN, content);
            await sock.sendPresenceUpdate('paused', ID_GRUP_TUJUAN);
            return true;
        } catch (err) {
            console.log("Gagal kirim pertama, mencoba jalur darurat...");
            try {
                await sock.groupFetchAllParticipating();
                await delay(2000);
                await sock.sendMessage(ID_GRUP_TUJUAN, content);
                return true;
            } catch (err2) {
                console.error("Gagal Total Kirim Grup:", err2.message);
                return false;
            }
        }
    };

    try {
        await sock.readMessages([msg.key]);

        // --- FITUR UMUM ---
        if (cmd === '!p') return await sock.sendMessage(sender, { text: '✅ *Bot Aktif!*' });

        if (cmd === '!pr') {
            await sock.sendPresenceUpdate('composing', sender);
            await delay(1000);
            return await sock.sendMessage(sender, { text: formatRekap() });
        }

        if (cmd === '!menu') {
            const menu = `📖 *Daftar Perintah Bot*\n\n🔹 !p ➜ Cek Status\n🔹 !pr ➜ Rekap PR\n\n⚙️ *Khusus Pengurus:*\n🔸 !grup ➜ Kirim Rekap ke Grup\n🔸 !update [hari] [isi] ➜ Simpan & Kirim\n🔸 !update jadwal [hari] [isi] ➜ Simpan Saja\n🔸 !hapus [hari] ➜ Kosongkan Tugas\n🔸 !info [pesan] ➜ Pengumuman Grup\n🔸 !reset-bot ➜ Reset Sesi Total`;
            return await sock.sendMessage(sender, { text: menu });
        }

        // --- FITUR ADMIN ---
        if (['!grup', '!update', '!hapus', '!info'].includes(cmd)) {
            if (!isAdmin) return await sock.sendMessage(sender, { text: `🚫 *Akses Ditolak!*` });

            // Fitur Info (Sudah Diperbarui Formatnya)
            if (cmd === '!info') {
                const infoMessage = body.slice(6).trim();
                if (!infoMessage) return await sock.sendMessage(sender, { text: '⚠️ Isi pesan infonya!' });

                const finalMessage = `📢 *PENGUMUMAN INFO BARU* 📢\n\n${infoMessage}\n\n---------------------------------------------------------------------------------\n_Info dari: Pengurus List Tugas_`;

                const sukses = await sendToGroupSafe({ text: finalMessage });
                return await sock.sendMessage(sender, { text: sukses ? '✅ Terkirim ke grup.' : '❌ Gagal. Ketik !reset-bot dan scan ulang.' });
            }

            if (cmd === '!grup') {
                const sukses = await sendToGroupSafe({ text: formatRekap() });
                return await sock.sendMessage(sender, { text: sukses ? '✅ Rekap terkirim.' : '❌ Gagal mengirim.' });
            }

            if (cmd === '!update') {
                const isOnlySave = textLower.includes('jadwal');
                const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
                let targetDay = days.find(day => textLower.includes(day));

                if (!targetDay) return await sock.sendMessage(sender, { text: '⚠️ Pilih hari!' });

                let content = body.replace(/!update/i, '').replace(/jadwal/i, '').replace(new RegExp(targetDay, 'gi'), '').trim();
                if (!content) return await sock.sendMessage(sender, { text: '⚠️ Isi tugasnya!' });

                db.updateTugas(targetDay, content);

                if (isOnlySave) {
                    return await sock.sendMessage(sender, { text: `✅ Berhasil disimpan secara lokal.` });
                } else {
                    const sukses = await sendToGroupSafe({ text: `📢 *UPDATE TUGAS: ${targetDay.toUpperCase()}*\n\n${content}\n\n_Cek list lengkap ketik *!pr*_` });
                    return await sock.sendMessage(sender, { text: sukses ? `✅ Update & Kirim Berhasil!` : `✅ Berhasil Update Lokal, tapi Gagal Kirim Grup.` });
                }
            }

            if (cmd === '!hapus') {
                const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
                let targetDay = days.find(day => textLower.includes(day));
                if (!targetDay) return await sock.sendMessage(sender, { text: '⚠️ Pilih hari!' });
                db.updateTugas(targetDay, "Belum ada tugas.");
                return await sock.sendMessage(sender, { text: `✅ Hari *${targetDay}* dikosongkan.` });
            }
        }
    } catch (err) {
        console.error("Handler Error:", err);
    }
}

module.exports = { handleMessages };
