const db = require('./data');
const { delay, downloadMediaMessage } = require("@whiskeysockets/baileys"); 
const fs = require('fs');
const path = require('path');
const axios = require('axios'); 
const FormData = require('form-data'); 
const { QUIZ_BANK } = require('./quiz'); 
const { MAPEL_CONFIG, STRUKTUR_JADWAL, LABELS } = require('./pelajaran');

// --- TAMBAHAN: Import AI Handler ---
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
    const validCommands = ['!p', '!pr', '!deadline', '!menu', '!update', '!update_jadwal', '!hapus', '!grup', '!polling', '!info', '!reset-bot', '!polling_kirim', '!data', '!cek_db'];
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
        const nonAdminMsg = "🚫 *AKSES DITOLAK*\n\nMaaf, fitur ini hanya bisa diakses oleh *Pengurus*. Kamu adalah pengguna biasa, silakan gunakan fitur pengguna seperti *!pr* atau *!deadline* saja ya! 😊";

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

        const triggers = ['p', 'pr', 'menu', 'update', 'update_jadwal', 'hapus', 'grup', 'info', 'deadline', 'polling', 'polling_kirim', 'data', 'cek_db'];
        const firstWord = textLower.split(' ')[0].replace('!', '');
        if (!body.startsWith('!') && triggers.includes(firstWord)) {
            return await sock.sendMessage(sender, { text: `⚠️ *Format Salah!*\n\nGunakan tanda seru (*!*) di depan perintah.\n💡 Contoh: *!menu*` });
        }

        if (body.startsWith('!')) {
            const cmdInput = body.split(' ')[0].toLowerCase();
            const suggestion = getClosestCommand(cmdInput);
            const validCmds = ['!p', '!pr', '!deadline', '!menu', '!update', '!update_jadwal', '!hapus', '!grup', '!polling', '!info', '!reset-bot', '!polling_kirim', '!data', '!cek_db'];
            if (!validCmds.includes(cmdInput) && suggestion) {
                return await sock.sendMessage(sender, { text: `🧐 *Perintah tidak dikenal.*\n\nMungkin maksud Anda: *${suggestion}* ?\nKetik *!menu* untuk melihat semua perintah.` });
            }
        }

        if (!body.startsWith('!')) return;

        await sock.readMessages([msg.key]);
        const args = body.split(' ');
        const cmd = args[0].toLowerCase();
        const { dates, periode } = utils.getWeekDates();

        const getProcessedTask = (dayKey, input) => {
            const dayMap = { 'senin': 0, 'selasa': 1, 'rabu': 2, 'kamis': 3, 'jumat': 4 };
            const dayLabels = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
            let allData = db.getAll() || {};
            let currentData = String(allData[dayKey] || ""); 
            
            if (currentData.includes("Belum ada tugas")) {
                currentData = "";
            }

            let existingEntries = currentData.split(/\n(?=•)/g).filter(e => e.trim() !== "");

            if (!STRUKTUR_JADWAL[dayKey]) return "";

            STRUKTUR_JADWAL[dayKey].forEach(mKey => {
                const emojiMapel = MAPEL_CONFIG[mKey];
                const mapelRegex = new RegExp(`\\b${mKey}\\b`, 'i');
                
                if (mapelRegex.test(input)) {
                    let parts = input.split(mapelRegex);
                    // Ambil deskripsi dasar (sebelum link pembatas)
                    let desc = (parts[1] && parts[1].trim() !== "") ? parts[1].split(/label:/i)[0].split(/━━━━━━━━━━━━━━━━━━━━/)[0].trim() : "";
                    if (desc === "") return;

                    // Ambil bagian link jika ada pembatasnya
                    let linkSection = "";
                    if (input.includes('━━━━━━━━━━━━━━━━━━━━')) {
                        const partsLink = input.split('━━━━━━━━━━━━━━━━━━━━');
                        if (partsLink.length >= 3) {
                            linkSection = `\n━━━━━━━━━━━━━━━━━━━━${partsLink[1]}━━━━━━━━━━━━━━━━━━━━`;
                        }
                    }

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
            rekap += `━━━━━━━━━━━━━━━━━━━━\n⏳ *DAFTAR TUGAS BELUM DIKUMPULKAN:*\n${currentData.deadline || "Semua tugas sudah selesai."}\n\n⚠️ *Salah list tugas?*\nHubungi nomor: *089531549103*`;
            return rekap;
        };

        const sendToGroupSafe = async (content) => {
            await sock.sendPresenceUpdate('composing', ID_GRUP_TUJUAN);
            await delay(2000);
            await sock.sendMessage(ID_GRUP_TUJUAN, content);
        };

        switch (cmd) {
            case '!p': await sock.sendMessage(sender, { text: '✅ *Bot Aktif & Terkoneksi!*' }); break;
            case '!pr': await sock.sendMessage(sender, { text: formatRekap() }); break;
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
            case '!cek_db':
                if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
                const allDataDb = db.getAll() || {};
                let teksDb = "📂 *KONTROL DATABASE PR*\n━━━━━━━━━━━━━━━━━━━━\n\n";
                ['senin', 'selasa', 'rabu', 'kamis', 'jumat'].forEach(hari => {
                    const isi = allDataDb[hari] || "_Kosong_";
                    teksDb += `📌 *${hari.toUpperCase()}*:\n${isi}\n\n`;
                });
                teksDb += "━━━━━━━━━━━━━━━━━━━━";
                await sock.sendMessage(sender, { text: teksDb });
                break;
            case '!menu':
                const menu = `📖 *MENU BOT TUGAS*\n\n*PENGGUNA:* \n🔹 !p - Cek Aktif\n🔹 !pr - List Tugas\n🔹 !deadline - Daftar Belum Dikumpul\n\n*PENGURUS:* \n🔸 !update [hari] [tugas]\n🔸 !update_jadwal [hari] [tugas]\n🔸 !deadline [isi info]\n🔸 !cek_db [cek database]\n🔸 !hapus [hari/deadline]\n🔸 !grup (Kirim rekap ke grup)\n🔸 !data (Kirim Jadwal Besok ke grup)\n🔸 !polling [soal] | [opsi:feedback]\n🔸 !polling_kirim [hari]\n🔸 !info [pesan]`;
                await sock.sendMessage(sender, { text: menu });
                break;
            case '!data':
                if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
                if (utils && typeof utils.sendJadwalBesokManual === 'function') {
                    await utils.sendJadwalBesokManual(sock, sender);
                    await sock.sendMessage(sender, { text: "✅ *Laporan jadwal besok sudah saya kirim ke sini ya!*" });
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
                        await sock.sendMessage(sender, { text: "⏳ *Sedang memproses file menjadi link web...*" });
                        const buffer = await downloadMediaMessage(msg, 'buffer', {});
                        const ext = isImage ? '.jpg' : path.extname(isDoc.fileName) || '.pdf';
                        const fileLabel = isImage ? "Gambar" : "PDF/File";
                        const fileName = `tugas_${Date.now()}${ext}`;
                        const fullPath = path.join(PUBLIC_PATH, fileName);
                        fs.writeFileSync(fullPath, buffer);
                        
                        // Format link dibungkus pembatas
                        mediaSection = `\n━━━━━━━━━━━━━━━━━━━━\n🔗 Link Web File ${fileLabel}:\n${MY_DOMAIN}/tugas/${fileName}\n━━━━━━━━━━━━━━━━━━━━`;
                    } catch (err) {
                        console.error("Upload Error:", err);
                        await sock.sendMessage(sender, { text: "⚠️ Gagal membuat link file, tetap memproses teks..." });
                    }
                }

                const daysUpdate = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
                const firstPart = args.slice(0, 3).join(' ').toLowerCase();
                let dIdx = daysUpdate.findIndex(d => firstPart.includes(d));
                if (dIdx === -1) return await sock.sendMessage(sender, { text: "❌ *HARI TIDAK DITEMUKAN*" });
                const dayKey = daysUpdate[dIdx];
                const mapelList = STRUKTUR_JADWAL[dayKey];
                const isMapelFound = mapelList.some(m => new RegExp(`\\b${m}\\b`, 'i').test(body));
                if (!isMapelFound) {
                    return await sock.sendMessage(sender, { 
                        text: `❌ *MAPEL SALAH/TYPO*\n\nMapel hari *${dayKey.toUpperCase()}* adalah:\n> ${mapelList.join(', ')}` 
                    });
                }

                let bodyToProcess = body;
                if (mediaSection) bodyToProcess += mediaSection;

                let res = getProcessedTask(dayKey, bodyToProcess);
                if (res) {
                    db.updateTugas(dayKey, res);
                    if (cmd === '!update') {
                        await sendToGroupSafe({ text: `📌 *Daftar tugas/ pr di Minggu ini* 📢\n➝ ${periode}\n\n---------------------------------------------------------------------------------\n\n\n*\`📅 ${dayKey.toUpperCase()}\`* ➝ ${dates[dIdx]}\n\n${res}` });
                    }
                    await sock.sendMessage(sender, { text: `✅ Berhasil Update data ${dayKey}!` });
                }
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
            case '!hapus':
                if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
                const targetHapus = args[1]?.toLowerCase();
                const targetMapel = args.slice(2).join(' ').toLowerCase();

                if (['senin', 'selasa', 'rabu', 'kamis', 'jumat'].includes(targetHapus)) {
                    if (!targetMapel) {
                        await sock.sendMessage(sender, { text: `⚠️ *Format Salah!*\n\nGunakan: *!hapus ${targetHapus} [nama mapel]*\nContoh: *!hapus ${targetHapus} mtk*\n\nAtau ketik *!hapus ${targetHapus} semua*` });
                        return;
                    }

                    if (targetMapel === 'semua') {
                        db.updateTugas(targetHapus, "");
                        await sock.sendMessage(sender, { text: `✅ Semua data hari *${targetHapus.toUpperCase()}* dihapus!` });
                        return;
                    }

                    const mList = STRUKTUR_JADWAL[targetHapus];
                    const findM = mList.find(m => new RegExp(`\\b${targetMapel}\\b`, 'i').test(m));
                    if (!findM) {
                        return await sock.sendMessage(sender, { text: `❌ *MAPEL TIDAK DITEMUKAN*\n\nMapel hari *${targetHapus.toUpperCase()}* adalah:\n> ${mList.join(', ')}` });
                    }

                    let allD = db.getAll() || {};
                    let currentD = allD[targetHapus] || "";
                    const emojiM = MAPEL_CONFIG[findM];
                    let entries = currentD.split('\n\n');
                    let filtered = entries.filter(e => !e.includes(emojiM));
                    db.updateTugas(targetHapus, filtered.join('\n\n'));
                    await sock.sendMessage(sender, { text: `✅ Berhasil menghapus tugas *${findM}* di hari *${targetHapus}*!` });
                } else if (targetHapus === 'deadline') {
                    db.updateTugas('deadline', "");
                    await sock.sendMessage(sender, { text: `✅ Data *deadline* berhasil dihapus!` });
                } else {
                    await sock.sendMessage(sender, { text: "⚠️ Contoh: !hapus senin mtk" });
                }
                break;
        }
    } catch (err) { console.error("Error Handler:", err); }
}

module.exports = { handleMessages };
    
