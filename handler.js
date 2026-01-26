const db = require('./data');
const { delay } = require("@whiskeysockets/baileys");

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
    // Mengambil teks dari berbagai tipe pesan
    const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || "").trim();
    const textLower = body.toLowerCase();
    
    // --- 1. FITUR EDUKASI FORMAT (ANTI TYPO/LUPA !) ---
    const triggers = ['p', 'pr', 'menu', 'update', 'hapus', 'grup', 'info'];
    // Jika kata pertama ada di daftar trigger tapi TIDAK diawali !
    const firstWord = textLower.split(' ')[0];
    if (!body.startsWith('!') && triggers.includes(firstWord)) {
        const pesanEdukasi = `⚠️ *Format Salah!*\n\nUntuk menggunakan bot, kamu harus menggunakan tanda seru (*!*) di depan perintah.\n\n💡 Contoh: Ketik *!menu* atau *!pr*`;
        return await sock.sendMessage(sender, { text: pesanEdukasi });
    }

    // Jika pesan tidak diawali !, abaikan saja
    if (!body.startsWith('!')) return;

    const isAdmin = ADMIN_RAW.some(admin => sender.includes(admin));
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
        rekap += `_________________________________\n\n*semangat menyelesaikan semua tugasnya! 🚀*`;
        return rekap;
    };

    // Fungsi Pengiriman Grup yang Lebih Kuat (Anti Session Error)
    const sendToGroupSafe = async (content) => {
        try {
            // Pancing metadata grup dulu
            await sock.groupMetadata(ID_GRUP_TUJUAN);
            await sock.sendPresenceUpdate('composing', ID_GRUP_TUJUAN);
            await delay(2000); // Beri waktu buat enkripsi nyambung
            await sock.sendMessage(ID_GRUP_TUJUAN, content);
            return true;
        } catch (err) {
            console.log("Percobaan 1 Gagal, Mencoba Re-sync...");
            try {
                // Pancing dengan fetch semua grup
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
            const menu = `📖 *Daftar Perintah Bot*\n\n🔹 !p ➜ Cek Status\n🔹 !pr ➜ Rekap PR\n\n⚙️ *Khusus Pengurus:*\n🔸 !grup ➜ Kirim Rekap ke Grup\n🔸 !update [hari] [isi] ➜ Simpan & Kirim\n🔸 !update jadwal [hari] [isi] ➜ Simpan Saja\n🔸 !hapus [hari] ➜ Kosongkan Tugas\n🔸 !info [pesan] ➜ Pengumuman Grup`;
            return await sock.sendMessage(sender, { text: menu });
        }

        // --- FITUR ADMIN ---
        if (['!grup', '!update', '!hapus', '!info'].includes(cmd)) {
            if (!isAdmin) {
                return await sock.sendMessage(sender, { text: `🚫 *Akses Ditolak!*\n\nHubungi: *${NOMOR_PENGURUS}*` });
            }

            if (cmd === '!info') {
                const info = body.slice(6).trim();
                if (!info) return await sock.sendMessage(sender, { text: '⚠️ Isi infonya!' });
                const msgInfo = { text: `📢 *INFO BARU* 📢\n\n${info}\n\n_________________________________` };
                const sukses = await sendToGroupSafe(msgInfo);
                return await sock.sendMessage(sender, { text: sukses ? '✅ Terkirim ke grup.' : '❌ Gagal (Session Error). Tolong Tag Bot di grup dulu.' });
            }

            if (cmd === '!grup') {
                const sukses = await sendToGroupSafe({ text: formatRekap() });
                return await sock.sendMessage(sender, { text: sukses ? '✅ Rekap terkirim.' : '❌ Gagal (Session Error).' });
            }

            if (cmd === '!update') {
                const isOnlySave = textLower.includes('jadwal');
                const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
                let targetDay = days.find(day => textLower.includes(day));

                if (!targetDay) return await sock.sendMessage(sender, { text: '⚠️ Pilih hari! (Senin-Jumat)' });

                let content = body.replace(/!update/i, '').replace(/jadwal/i, '').replace(new RegExp(targetDay, 'gi'), '').trim();
                if (!content) return await sock.sendMessage(sender, { text: '⚠️ Isi tugasnya!' });

                db.updateTugas(targetDay, content);

                if (isOnlySave) {
                    return await sock.sendMessage(sender, { text: `✅ Berhasil Disimpan Lokal!` });
                } else {
                    const updateMsg = { text: `📢 *UPDATE TUGAS PR: ${targetDay.toUpperCase()}*\n\n${content}\n\n_Cek list lengkap ketik *!pr*_` };
                    const sukses = await sendToGroupSafe(updateMsg);
                    return await sock.sendMessage(sender, { text: sukses ? `✅ Update & Kirim Berhasil!` : `✅ Update Lokal Berhasil, tapi Gagal Kirim Grup (Session Error).` });
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
