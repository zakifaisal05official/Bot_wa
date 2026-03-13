const db = require('./data');
const { delay, downloadMediaMessage } = require("@whiskeysockets/baileys"); 
const fs = require('fs');
const path = require('path');
const axios = require('axios'); 
const FormData = require('form-data'); 
const { QUIZ_BANK } = require('./quiz'); 
const { MAPEL_CONFIG, STRUKTUR_JADWAL, LABELS } = require('./pelajaran');

// --- TAMBAHAN: Import dari constants & AI ---
const { JADWAL_PELAJARAN, MOTIVASI_SEKOLAH } = require('./constants');
const { askAI } = require('./ai_handler');

// Pastikan folder untuk simpan file ada di dalam Volume agar tidak hilang saat restart
const PUBLIC_PATH = '/app/auth_info/public_files';
if (!fs.existsSync(PUBLIC_PATH)) {
    fs.mkdirSync(PUBLIC_PATH, { recursive: true });
}

const ADMIN_RAW = ['6289531549103', '171425214255294', '6285158738155' , '241849843351688' , '254326740103190' , '8474121494667']; 
const ID_GRUP_TUJUAN = '120363403625197368@g.us'; 
const MY_DOMAIN = 'https://assitenymb.zeabur.app';

function getClosestCommand(cmd) {
    const validCommands = ['!p', '!pr', '!deadline', '!menu', '!update', '!update_jadwal', '!hapus', '!grup', '!polling', '!info', '!reset-bot', '!polling_kirim', '!data', '!cek_db', '!jadwal_baru'];
    if (validCommands.includes(cmd)) return null;
    return validCommands.find(v => {
        const distance = Math.abs(v.length - cmd.length);
        return distance <= 1 && (v.startsWith(cmd.substring(0, 2)) || cmd.startsWith(v.substring(0, 2)));
    });
}

async function handleMessages(sock, m, botConfig, utils) {
    try {
        const msg = m.messages[0];
        if (!msg || !msg.message || msg.key.fromMe) return;

        // --- POLLING HANDLER ---
        if (msg.pollUpdates && botConfig?.smartFeedback !== false) {
            const KUIS_PATH = '/app/auth_info/kuis.json';
            if (fs.existsSync(KUIS_PATH)) {
                let kuisData = JSON.parse(fs.readFileSync(KUIS_PATH, 'utf-8'));
                const update = msg.pollUpdates[0];
                const pollCreationId = msg.key.id;
                if (kuisData.msgId === pollCreationId || msg.messageContextInfo) {
                    const voter = msg.key.participant || msg.key.remoteJid;
                    const votes = update.vote?.selectedOptions || [];
                    kuisData.votes[voter] = votes;
                    fs.writeFileSync(KUIS_PATH, JSON.stringify(kuisData, null, 2));
                }
            }
        }

        const sender = msg.key.remoteJid;
        const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || msg.message.documentMessage?.caption || "").trim();
        if (!body) return;
        const textLower = body.toLowerCase();
        const isAdmin = ADMIN_RAW.some(admin => sender.includes(admin));
        const nonAdminMsg = "🚫 *AKSES DITOLAK*\n\nMaaf ridfot, fitur ini hanya bisa diakses oleh *Pengurus*. Kamu adalah pengguna biasa, silakan gunakan fitur pengguna seperti *!pr* atau *!deadline* saja ya! 😊";

        // --- TAMBAHAN: Logika AI Asisten ---
        if (textLower.includes('asisten')) {
            await sock.sendPresenceUpdate('composing', sender);
            const response = await askAI(body);
            await sock.sendMessage(sender, { text: response }, { quoted: msg });
            return; 
        }

        if (body === '!reset-bot') {
            if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
            await sock.sendMessage(sender, { text: "⚠️ *MENGHAPUS SESI TOTAL...*\nBot akan restart." });
            await delay(2000); 
            if (fs.existsSync('./auth_info')) fs.rmSync('./auth_info', { recursive: true, force: true });
            process.exit(1);
        }

        const triggers = ['p', 'pr', 'menu', 'update', 'update_jadwal', 'hapus', 'grup', 'info', 'deadline', 'polling', 'polling_kirim', 'data', 'cek_db', 'jadwal_baru'];
        const firstWord = textLower.split(' ')[0].replace('!', '');
        if (!body.startsWith('!') && triggers.includes(firstWord)) {
            return await sock.sendMessage(sender, { text: `⚠️ *Format Salah ridfot!*\n\nGunakan tanda seru (*!*) di depan perintah.\n💡 Contoh: *!menu*` });
        }

        if (body.startsWith('!')) {
            const cmdInput = body.split(' ')[0].toLowerCase();
            const suggestion = getClosestCommand(cmdInput);
            const validCmds = ['!p', '!pr', '!deadline', '!menu', '!update', '!update_jadwal', '!hapus', '!grup', '!polling', '!info', '!reset-bot', '!polling_kirim', '!data', '!cek_db', '!jadwal_baru'];
            if (!validCmds.includes(cmdInput) && suggestion) {
                return await sock.sendMessage(sender, { text: `🧐 *Perintah tidak dikenal.*\n\nMungkin maksud Anda: *${suggestion}* ?\nKetik *!menu* untuk melihat semua perintah.` });
            }
        }

        if (!body.startsWith('!')) return;

        await sock.readMessages([msg.key]);
        const args = body.split(' ');
        const cmd = args[0].toLowerCase();
        const { dates, periode } = utils.getWeekDates();

        // --- CORE: LOGIKA PENGOLAH TUGAS (Auto Label) ---
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
                    
                    // Bersihkan deskripsi dari keyword label agar tidak double
                    for (let l in LABELS) {
                        desc = desc.replace(new RegExp(`\\b${l}\\b`, 'gi'), "").trim();
                    }

                    if (desc === "") return;

                    let linkSection = "";
                    if (input.includes('━━━━━━━━━━━━━━━━━━━━')) {
                        const partsLink = input.split('━━━━━━━━━━━━━━━━━━━━');
                        if (partsLink.length >= 3) {
                            linkSection = `\n━━━━━━━━━━━━━━━━━━━━${partsLink[1]}━━━━━━━━━━━━━━━━━━━━`;
                        }
                    }

                    // Deteksi Label dari input
                    let labelsFound = [];
                    for (let l in LABELS) { 
                        if (new RegExp(`\\b${l}\\b`, 'i').test(input)) { 
                            labelsFound.push(LABELS[l]); 
                        } 
                    }
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

        const formatRekap = () => {
            const currentData = db.getAll() || {};
            const motivasi = MOTIVASI_SEKOLAH[Math.floor(Math.random() * MOTIVASI_SEKOLAH.length)];
            let rekap = `📌 *DAFTAR LIST TUGAS PR* 📢\n🗓️ Periode: ${periode}\n\n━━━━━━━━━━━━━━━━━━━━\n\n`;
            ['senin', 'selasa', 'rabu', 'kamis', 'jumat'].forEach((day, i) => {
                const dayLabelsFull = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'];
                const dayLabelsSmall = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
                rekap += `📅 *${dayLabelsFull[i]}* (${dates[i]})\n`;
                let tugas = currentData[day];
                
                if (!tugas || tugas.trim() === "" || tugas.includes("Belum ada tugas")) {
                    rekap += `└─ ✅ _Tidak ada PR_\n\n`;
                } else { 
                    let cleanTugas = tugas.split('\n').filter(line => !line.includes('⏰ Deadline:')).join('\n').trim();
                    let updatedTugas = cleanTugas.replace(/(\|)$/gm, `$1\n⏰ Deadline: ${dayLabelsSmall[i]}, ${dates[i]}`);
                    if (!updatedTugas.includes('⏰ Deadline:')) {
                        updatedTugas += `\n⏰ Deadline: ${dayLabelsSmall[i]}, ${dates[i]}`;
                    }
                    rekap += `${updatedTugas}\n\n`; 
                }
            });
            rekap += `━━━━━━━━━━━━━━━━━━━━\n⏳ *DAFTAR TUGAS BELUM DIKUMPULKAN:*\n${currentData.deadline || "Semua tugas sudah selesai."}\n\n💡 _${motivasi}_\n\n⚠️ *Salah list tugas?*\nHubungi nomor: *089531549103*`;
            return rekap;
        };

        const sendToGroupSafe = async (content) => {
            await sock.sendPresenceUpdate('composing', ID_GRUP_TUJUAN);
            await delay(2000);
            await sock.sendMessage(ID_GRUP_TUJUAN, content);
        };

        // --- SWITCH COMMANDS ---
        switch (cmd) {
            case '!p': await sock.sendMessage(sender, { text: '✅ *Bot Aktif & Terkoneksi!*' }); break;
            case '!pr': await sock.sendMessage(sender, { text: formatRekap() }); break;
            
            case '!jadwal_baru':
                if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
                try {
                    await sock.sendMessage(sender, { text: "⏳ *Sedang menyelaraskan jadwal...*" });
                    const dayKeys = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
                    const currentDb = db.getAll() || {};
                    const backupPR = [];
                    dayKeys.forEach(h => {
                        if (currentDb[h] && !currentDb[h].includes("Belum ada tugas")) {
                            backupPR.push(...currentDb[h].split(/\n(?=•)/g));
                        }
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
                    await sock.sendMessage(sender, { text: "✅ *SISTEM REFRESHED ridfot!*" });
                } catch (e) { await sock.sendMessage(sender, { text: "❌ Error: " + e.message }); }
                break;

            case '!deadline':
                if (args.length === 1) {
                    const infoDl = (db.getAll() || {}).deadline || "Semua tugas sudah selesai.";
                    await sock.sendMessage(sender, { text: `⏳ *DAFTAR TUGAS BELUM DIKUMPULKAN*\n\n${infoDl}` });
                } else {
                    if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
                    db.updateTugas('deadline', body.slice(10).trim());
                    await sock.sendMessage(sender, { text: `✅ Daftar tugas belum dikumpul diperbarui!` });
                }
                break;

            case '!update':
            case '!update_jadwal':
                if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
                let mediaSection = "";
                const isImage = msg.message.imageMessage;
                const isDoc = msg.message.documentMessage;

                if (isImage || isDoc) {
                    try {
                        await sock.sendMessage(sender, { text: "⏳ *Memproses file...*" });
                        const buffer = await downloadMediaMessage(msg, 'buffer', {});
                        const ext = isImage ? '.jpg' : path.extname(isDoc.fileName) || '.pdf';
                        const fileName = `tugas_${Date.now()}${ext}`;
                        fs.writeFileSync(path.join(PUBLIC_PATH, fileName), buffer);
                        mediaSection = `\n━━━━━━━━━━━━━━━━━━━━\n🔗 Link Web File:\n${MY_DOMAIN}/tugas/${fileName}\n━━━━━━━━━━━━━━━━━━━━`;
                    } catch (err) { await sock.sendMessage(sender, { text: "⚠️ Gagal membuat link file..." }); }
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
                const resUpdate = getProcessedTask(dayKey, body + mediaSection);
                if (resUpdate) {
                    db.updateTugas(dayKey, resUpdate);
                    if (cmd === '!update') await sendToGroupSafe({ text: `📌 *Update PR Baru* 📢\n\n*\`📅 ${dayKey.toUpperCase()}\`*\n\n${resUpdate}` });
                    await sock.sendMessage(sender, { text: `✅ Berhasil Update data ${dayKey}!` });
                }
                break;

            case '!hapus':
                if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
                const targetHapus = args[1]?.toLowerCase();
                const targetMapel = args.slice(2).join(' ').toLowerCase();

                if (['senin', 'selasa', 'rabu', 'kamis', 'jumat'].includes(targetHapus)) {
                    if (targetMapel === 'semua') {
                        db.updateTugas(targetHapus, "");
                        await sock.sendMessage(sender, { text: `✅ Data ${targetHapus} dihapus!` });
                    } else {
                        let allD = db.getAll() || {};
                        let filtered = (allD[targetHapus] || "").split('\n\n').filter(e => !e.toLowerCase().includes(targetMapel));
                        db.updateTugas(targetHapus, filtered.join('\n\n'));
                        await sock.sendMessage(sender, { text: `✅ Tugas ${targetMapel} dihapus!` });
                    }
                } else if (targetHapus === 'deadline') {
                    db.updateTugas('deadline', "");
                    await sock.sendMessage(sender, { text: `✅ Deadline dihapus!` });
                }
                break;

            case '!cek_db':
                if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
                let teksDb = "📂 *DATABASE PR*\n\n";
                ['senin', 'selasa', 'rabu', 'kamis', 'jumat'].forEach(h => {
                    teksDb += `📌 *${h.toUpperCase()}*:\n${db.getAll()[h] || "_Kosong_"}\n\n`;
                });
                await sock.sendMessage(sender, { text: teksDb });
                break;

            case '!menu':
                await sock.sendMessage(sender, { text: `📖 *MENU BOT TUGAS*\n\n*PENGGUNA:* \n🔹 !p, !pr, !deadline\n\n*PENGURUS:* \n🔸 !update, !jadwal_baru, !hapus, !grup, !cek_db, !info` });
                break;
                
            case '!grup':
                if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
                await sendToGroupSafe({ text: formatRekap() });
                break;

            case '!info':
                if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
                const infoMsgText = body.slice(6).trim();
                if (infoMsgText) await sendToGroupSafe({ text: `📢 *PENGUMUMAN*\n\n${infoMsgText}\n\n_— Pengurus_` });
                break;

            case '!data':
                if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
                if (utils?.sendJadwalBesokManual) {
                    await utils.sendJadwalBesokManual(sock, sender);
                    await sock.sendMessage(sender, { text: "✅ *Laporan jadwal besok terkirim!*" });
                }
                break;
        }
    } catch (err) { console.error("Error Handler:", err); }
}

module.exports = { handleMessages };
