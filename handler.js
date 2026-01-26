const db = require('./data');
const { delay } = require("@whiskeysockets/baileys");
const fs = require('fs');

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

async function handleMessages(sock, m) {
    try {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || "").trim();
        const textLower = body.toLowerCase();
        
        // Cek Admin dengan lebih akurat
        const isAdmin = ADMIN_RAW.some(admin => sender.includes(admin));

        // --- 1. FITUR EMERGENCY: RESET SESSION ---
        if (body === '!reset-bot' && isAdmin) {
            await sock.sendMessage(sender, { text: "⚠️ *MENGHAPUS SESI TOTAL...*\nBot akan restart. Tunggu sebentar lalu cek web UI untuk scan ulang jika diperlukan." });
            console.log("Sesi dihapus oleh admin via perintah !reset-bot");
            
            // Beri jeda agar pesan terkirim sebelum proses mati
            await delay(2000); 
            fs.rmSync('./auth_info', { recursive: true, force: true });
            process.exit(1);
        }

        // --- 2. FITUR EDUKASI FORMAT (ANTI LUPA !) ---
        const triggers = ['p', 'pr', 'menu', 'update', 'hapus', 'grup', 'info'];
        const firstWord = textLower.split(' ')[0];
        
        if (!body.startsWith('!') && triggers.includes(firstWord)) {
            const pesanEdukasi = `⚠️ *Format Salah!*\n\nGunakan tanda seru (*!*) di depan perintah.\n\n💡 Contoh: *!menu* atau *!pr*`;
            return await sock.sendMessage(sender, { text: pesanEdukasi });
        }

        if (!body.startsWith('!')) return;

        // Tandai pesan sebagai terbaca (Opsional, agar tidak terlihat unread terus)
        await sock.readMessages([msg.key]);

        const args = body.split(' ');
        const cmd = args[0].toLowerCase();
        const { dates, periode } = getWeekDates();

        // Rekap Generator
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
            rekap += `━━━━━━━━━━━━━━━━━━━━\n_Gunakan *!pr* untuk cek secara mandiri._`;
            return rekap;
        };

        // --- FUNGSI PENGIRIMAN GRUP STABIL ---
        const sendToGroupSafe = async (content) => {
            try {
                // Beri simulasi "sedang mengetik" agar terlihat alami
                await sock.sendPresenceUpdate('composing', ID_GRUP_TUJUAN);
                await delay(2000);
                await sock.sendMessage(ID_GRUP_TUJUAN, content);
                return true;
            } catch (err) {
                console.error("Gagal kirim ke grup:", err.message);
                return false;
            }
        };

        // --- LOGIKA PERINTAH ---
        switch (cmd) {
            case '!p':
                await sock.sendMessage(sender, { text: '✅ *Bot Aktif & Terkoneksi!*' });
                break;

            case '!pr':
                await sock.sendMessage(sender, { text: formatRekap() });
                break;

            case '!menu':
                const menu = `📖 *MENU BOT TUGAS*\n\n*PENGGUNA:* \n🔹 !p - Cek Aktif\n🔹 !pr - List Tugas\n\n*PENGURUS:* \n🔸 !update [hari] [tugas]\n🔸 !update jadwal [hari] [tugas]\n🔸 !hapus [hari]\n🔸 !grup (Kirim rekap ke grup)\n🔸 !info [pesan]\n🔸 !reset-bot`;
                await sock.sendMessage(sender, { text: menu });
                break;

            case '!info':
            case '!grup':
            case '!update':
            case '!hapus':
                if (!isAdmin) return await sock.sendMessage(sender, { text: `🚫 *Akses Ditolak!* Perintah ini hanya untuk admin.` });

                if (cmd === '!info') {
                    const infoMessage = body.slice(6).trim();
                    if (!infoMessage) return await sock.sendMessage(sender, { text: '⚠️ Isi pesan info!' });
                    const sukses = await sendToGroupSafe({ text: `📢 *PENGUMUMAN*\n\n${infoMessage}\n\n_— Pengurus_` });
                    await sock.sendMessage(sender, { text: sukses ? '✅ Terkirim.' : '❌ Gagal kirim.' });
                }

                if (cmd === '!grup') {
                    const sukses = await sendToGroupSafe({ text: formatRekap() });
                    await sock.sendMessage(sender, { text: sukses ? '✅ Rekap terkirim.' : '❌ Gagal.' });
                }

                if (cmd === '!update') {
                    const isOnlySave = textLower.includes('jadwal');
                    const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
                    let targetDay = days.find(day => textLower.includes(day));

                    if (!targetDay) return await sock.sendMessage(sender, { text: '⚠️ Format: !update [hari] [isi]' });

                    let content = body.replace(/!update/i, '').replace(/jadwal/i, '').replace(new RegExp(targetDay, 'gi'), '').trim();
                    if (!content) return await sock.sendMessage(sender, { text: '⚠️ Tugas tidak boleh kosong!' });

                    db.updateTugas(targetDay, content);

                    if (isOnlySave) {
                        await sock.sendMessage(sender, { text: `✅ Berhasil disimpan (Lokal).` });
                    } else {
                        const sukses = await sendToGroupSafe({ text: `📝 *TUGAS BARU: ${targetDay.toUpperCase()}*\n\n${content}\n\n_Ketik !pr untuk melihat list lengkap._` });
                        await sock.sendMessage(sender, { text: sukses ? `✅ Berhasil Update & Grup!` : `✅ Update Lokal Saja.` });
                    }
                }

                if (cmd === '!hapus') {
                    const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
                    let targetDay = days.find(day => textLower.includes(day));
                    if (!targetDay) return await sock.sendMessage(sender, { text: '⚠️ Pilih hari yang mau dihapus!' });
                    db.updateTugas(targetDay, "Belum ada tugas.");
                    await sock.sendMessage(sender, { text: `✅ Hari *${targetDay}* telah dibersihkan.` });
                }
                break;
        }

    } catch (err) {
        console.error("Handler Error:", err);
    }
}

module.exports = { handleMessages };
