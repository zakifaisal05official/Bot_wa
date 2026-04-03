const db = require('../data');
const { delay, downloadMediaMessage } = require("@whiskeysockets/baileys"); 
const fs = require('fs');
const path = require('path');
const { MAPEL_CONFIG, STRUKTUR_JADWAL, LABELS } = require('../pelajaran');
const { JADWAL_PELAJARAN } = require('../constants');

const ID_GRUP_TUJUAN = '120363403625197368@g.us'; 
const MY_DOMAIN = 'https://assitenymb.zeabur.app';
const PUBLIC_PATH = '/app/auth_info/public_files';

async function handleAdminCommands(sock, msg, cmd, args, utils, body, nonAdminMsg) {
    const sender = msg.key.remoteJid;
    const { dates } = utils.getWeekDates();

    const getProcessedTask = (dayKey, input) => {
        const dayMap = { 'senin': 0, 'selasa': 1, 'rabu': 2, 'kamis': 3, 'jumat': 4 };
        const dayLabels = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
        let allData = db.getAll() || {};
        let currentData = String(allData[dayKey] || ""); 
        if (currentData.includes("Belum ada tugas")) currentData = "";
        let existingEntries = currentData.split(/\n(?=•)/g).filter(e => e.trim() !== "");
        if (!STRUKTUR_JADWAL[dayKey]) return "";

        STRUKTUR_JADWAL[dayKey].forEach(mKey => {
            const emojiMapel = MAPEL_CONFIG[mKey];
            const mapelRegex = new RegExp(`\\b${mKey}\\b`, 'i');
            if (mapelRegex.test(input)) {
                let parts = input.split(mapelRegex);
                let desc = (parts[1] && parts[1].trim() !== "") ? parts[1].split(/label:/i)[0].split(/━━━━━━━━━━━━━━━━━━━━/)[0].trim() : "";
                if (desc === "") return;
                let linkSection = "";
                if (input.includes('━━━━━━━━━━━━━━━━━━━━')) {
                    const partsLink = input.split('━━━━━━━━━━━━━━━━━━━━');
                    if (partsLink.length >= 3) linkSection = `\n━━━━━━━━━━━━━━━━━━━━${partsLink[1]}━━━━━━━━━━━━━━━━━━━━`;
                }
                let labelsFound = [];
                for (let l in LABELS) { if (new RegExp(`\\b${l}\\b`, 'i').test(input)) labelsFound.push(LABELS[l]); }
                if (labelsFound.length === 0) labelsFound.push(LABELS['biasa']);
                let finalLabel = labelsFound.join(' | ');
                let existingIndex = existingEntries.findIndex(e => e.includes(emojiMapel));
                if (existingIndex !== -1) {
                    let lines = existingEntries[existingIndex].split('\n');
                    let separatorIdx = lines.findIndex(l => l.includes('------'));
                    if (!existingEntries[existingIndex].includes(desc)) {
                        if (separatorIdx !== -1) {
                            lines.splice(separatorIdx, 0, `➝ ${desc}${linkSection}`);
                            existingEntries[existingIndex] = lines.join('\n');
                        }
                    }
                } else {
                    let newContent = `• ${emojiMapel}\n➝ ${desc}${linkSection}\n------\n--} ${finalLabel} |\n⏰ Deadline: ${dayLabels[dayMap[dayKey]]}, ${dates[dayMap[dayKey]]}`;
                    existingEntries.push(newContent);
                }
            }
        });
        return existingEntries.join('\n\n').trim();
    };

    const sendToGroupSafe = async (content) => {
        await sock.sendPresenceUpdate('composing', ID_GRUP_TUJUAN);
        await delay(2000);
        await sock.sendMessage(ID_GRUP_TUJUAN, content);
    };

    switch (cmd) {
        case '!jadwal_baru':
            try {
                await sock.sendMessage(sender, { text: "⏳ *Sedang menyelaraskan jadwal dengan constants.js...*" });
                const dayKeys = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
                const currentDb = db.getAll() || {};
                const backupPR = [];
                dayKeys.forEach(h => {
                    if (currentDb[h] && !currentDb[h].includes("Belum ada tugas")) backupPR.push(...currentDb[h].split(/\n(?=•)/g));
                    db.updateTugas(h, ""); 
                });
                for (let i = 1; i <= 5; i++) {
                    const hKey = dayKeys[i-1];
                    const cleanMapels = JADWAL_PELAJARAN[i].toLowerCase().split('\n').map(l => l.replace(/[^\w\s]/gi, '').trim());
                    STRUKTUR_JADWAL[hKey] = cleanMapels;
                }
                backupPR.forEach(entry => {
                    for (const h of dayKeys) {
                        if (STRUKTUR_JADWAL[h].some(m => entry.toLowerCase().includes(m))) {
                            let old = db.getAll()[h] || "";
                            db.updateTugas(h, old ? old + "\n\n" + entry.trim() : entry.trim());
                            break;
                        }
                    }
                });
                await sock.sendMessage(sender, { text: "✅ *SISTEM REFRESHED!*\nJadwal dan PR telah disinkronkan." });
            } catch (e) { await sock.sendMessage(sender, { text: "❌ Error: " + e.message }); }
            break;

        case '!update':
        case '!update_jadwal':
            let mediaSection = "";
            const isImage = msg.message.imageMessage;
            const isDoc = msg.message.documentMessage;
            if (isImage || isDoc) {
                try {
                    await sock.sendMessage(sender, { text: "⏳ *Sedang memproses file menjadi link web...*" });
                    const buffer = await downloadMediaMessage(msg, 'buffer', {});
                    const ext = isImage ? '.jpg' : path.extname(isDoc.fileName) || '.pdf';
                    const fileLabel = isImage ? "Gambar" : "PDF/File";
                    const fileName = `tugas_${Date.now()}${ext}`;
                    const fullPath = path.join(PUBLIC_PATH, fileName);
                    fs.writeFileSync(fullPath, buffer);
                    mediaSection = `\n━━━━━━━━━━━━━━━━━━━━\n🔗 Link Web File ${fileLabel}:\n${MY_DOMAIN}/tugas/${fileName}\n━━━━━━━━━━━━━━━━━━━━`;
                } catch (err) { await sock.sendMessage(sender, { text: "⚠️ Gagal membuat link file, tetap memproses teks..." }); }
            }
            const daysUpdate = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
            const firstPart = args.slice(0, 3).join(' ').toLowerCase();
            let dIdx = daysUpdate.findIndex(d => firstPart.includes(d));
            if (dIdx === -1) {
                for (const h of daysUpdate) {
                    if (STRUKTUR_JADWAL[h].some(m => new RegExp(`\\b${m}\\b`, 'i').test(body))) {
                        dIdx = daysUpdate.indexOf(h); break;
                    }
                }
            }
            if (dIdx === -1) return await sock.sendMessage(sender, { text: "❌ *HARI ATAU MAPEL TIDAK DIKENALI*" });
            const dayKey = daysUpdate[dIdx];
            if (!STRUKTUR_JADWAL[dayKey].some(m => new RegExp(`\\b${m}\\b`, 'i').test(body))) {
                return await sock.sendMessage(sender, { text: `❌ *MAPEL SALAH/TYPO*\n\nMapel hari *${dayKey.toUpperCase()}* adalah:\n> ${STRUKTUR_JADWAL[dayKey].join(', ')}` });
            }
            let res = getProcessedTask(dayKey, body + mediaSection);
            if (res) {
                db.updateTugas(dayKey, res);
                if (cmd === '!update') await sendToGroupSafe({ text: `📌 *Update PR Baru* 📢\n\n*\`📅 ${dayKey.toUpperCase()}\`* ➝ ${dates[dIdx]}\n\n${res}` });
                await sock.sendMessage(sender, { text: `✅ Berhasil Update data ${dayKey}!` });
            }
            break;

        case '!hapus':
            const targetHapus = args[1]?.toLowerCase();
            const targetMapel = args.slice(2).join(' ').toLowerCase();
            if (['senin', 'selasa', 'rabu', 'kamis', 'jumat'].includes(targetHapus)) {
                if (!targetMapel) return await sock.sendMessage(sender, { text: `⚠️ *Format Salah!*\n\nGunakan: *!hapus ${targetHapus} [nama mapel]*` });
                if (targetMapel === 'semua') {
                    db.updateTugas(targetHapus, "");
                    await sock.sendMessage(sender, { text: `✅ Semua data hari *${targetHapus.toUpperCase()}* dihapus!` });
                } else {
                    const findM = STRUKTUR_JADWAL[targetHapus].find(m => new RegExp(`\\b${targetMapel}\\b`, 'i').test(m));
                    if (!findM) return await sock.sendMessage(sender, { text: `❌ *MAPEL TIDAK DITEMUKAN*` });
                    let filtered = (db.getAll()[targetHapus] || "").split('\n\n').filter(e => !e.includes(MAPEL_CONFIG[findM]));
                    db.updateTugas(targetHapus, filtered.join('\n\n'));
                    await sock.sendMessage(sender, { text: `✅ Berhasil menghapus tugas *${findM}*!` });
                }
            } else if (targetHapus === 'deadline') {
                db.updateTugas('deadline', "");
                await sock.sendMessage(sender, { text: `✅ Data *deadline* berhasil dihapus!` });
            }
            break;

        case '!deadline':
            db.updateTugas('deadline', body.slice(10).trim());
            await sock.sendMessage(sender, { text: `✅ Daftar tugas belum dikumpul diperbarui!` });
            break;

        case '!cek_db':
            const allDataDb = db.getAll() || {};
            let teksDb = "📂 *KONTROL DATABASE PR*\n━━━━━━━━━━━━━━━━━━━━\n\n";
            ['senin', 'selasa', 'rabu', 'kamis', 'jumat'].forEach(hari => { teksDb += `📌 *${hari.toUpperCase()}*:\n${allDataDb[hari] || "_Kosong_"}\n\n`; });
            await sock.sendMessage(sender, { text: teksDb + "━━━━━━━━━━━━━━━━━━━━" });
            break;

        case '!grup':
            await sock.sendMessage(sender, { text: "✅ Perintah rekap diterima! (Gunakan !pr di grup)" });
            break;

        case '!info':
            const infoMsgText = body.slice(6).trim();
            if (infoMsgText) await sendToGroupSafe({ text: `📢 *PENGUMUMAN*\n\n${infoMsgText}\n\n_— Pengurus_` });
            break;
            
        case '!data':
            if (utils?.sendJadwalBesokManual) await utils.sendJadwalBesokManual(sock, sender);
            break;

        case '!reset-bot':
            await sock.sendMessage(sender, { text: "⚠️ *MENGHAPUS SESI TOTAL...*\nBot akan restart." });
            await delay(2000); 
            if (fs.existsSync('./auth_info')) fs.rmSync('./auth_info', { recursive: true, force: true });
            process.exit(1);
            break;
    }
}

module.exports = { handleAdminCommands };
