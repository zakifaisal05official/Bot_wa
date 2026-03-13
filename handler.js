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

        // --- Logika Polling ---
        if (msg.pollUpdates && botConfig?.smartFeedback !== false) {
            const KUIS_PATH = '/app/auth_info/kuis.json';
            if (fs.existsSync(KUIS_PATH)) {
                let kuisData = JSON.parse(fs.readFileSync(KUIS_PATH, 'utf-8'));
                const update = msg.pollUpdates[0];
                if (kuisData.msgId === msg.key.id || msg.messageContextInfo) {
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
        const nonAdminMsg = "🚫 *AKSES DITOLAK*\n\nMaaf, fitur ini hanya bisa diakses oleh *Pengurus*.";

        // --- AI Assistant ---
        if (textLower.includes('asisten')) {
            await sock.sendPresenceUpdate('composing', sender);
            const response = await askAI(body);
            await sock.sendMessage(sender, { text: response }, { quoted: msg });
            return; 
        }

        // --- Reset Bot ---
        if (body === '!reset-bot') {
            if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
            await sock.sendMessage(sender, { text: "⚠️ *RESTARTING...*" });
            await delay(2000); 
            process.exit(1);
        }

        const triggers = ['p', 'pr', 'menu', 'update', 'update_jadwal', 'hapus', 'grup', 'info', 'deadline', 'polling', 'polling_kirim', 'data', 'cek_db', 'jadwal_baru'];
        const firstWord = textLower.split(' ')[0].replace('!', '');
        if (!body.startsWith('!') && triggers.includes(firstWord)) {
            return await sock.sendMessage(sender, { text: `⚠️ Gunakan tanda seru (*!*) di depan perintah.` });
        }

        if (body.startsWith('!')) {
            const cmdInput = body.split(' ')[0].toLowerCase();
            const suggestion = getClosestCommand(cmdInput);
            if (!triggers.map(t => '!' + t).includes(cmdInput) && suggestion) {
                return await sock.sendMessage(sender, { text: `🧐 Mungkin maksud Anda: *${suggestion}* ?` });
            }
        }

        if (!body.startsWith('!')) return;

        await sock.readMessages([msg.key]);
        const args = body.split(' ');
        const cmd = args[0].toLowerCase();
        const { dates, periode } = utils.getWeekDates();

        // --- Helper: Proses Teks Tugas ---
        const getProcessedTask = (dayKey, input) => {
            const dayMap = { 'senin': 0, 'selasa': 1, 'rabu': 2, 'kamis': 3, 'jumat': 4 };
            const dayLabels = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
            let allData = db.getAll() || {};
            let currentData = String(allData[dayKey] || "").replace("Belum ada tugas", ""); 

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
                        let sepIdx = lines.findIndex(l => l.includes('------'));
                        if (!existingEntries[existingIndex].includes(desc) && sepIdx !== -1) {
                            lines.splice(sepIdx, 0, `➝ ${desc}${linkSection}`);
                            existingEntries[existingIndex] = lines.join('\n');
                        }
                    } else {
                        existingEntries.push(`• ${emojiMapel}\n➝ ${desc}${linkSection}\n------\n--} ${finalLabel} |\n⏰ Deadline: ${dayLabels[dayMap[dayKey]]}, ${dates[dayMap[dayKey]]}`);
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
                const dLabels = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'];
                const sLabels = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
                rekap += `📅 *${dLabels[i]}* (${dates[i]})\n`;
                let tugas = currentData[day];
                if (!tugas || tugas.trim() === "" || tugas.includes("Belum ada tugas")) {
                    rekap += `└─ ✅ _Tidak ada PR_\n\n`;
                } else { 
                    let clean = tugas.split('\n').filter(line => !line.includes('⏰ Deadline:')).join('\n').trim();
                    rekap += `${clean.replace(/(\|)$/gm, `$1\n⏰ Deadline: ${sLabels[i]}, ${dates[i]}`)}\n\n`; 
                }
            });
            rekap += `━━━━━━━━━━━━━━━━━━━━\n💡 _${motivasi}_\n\n⚠️ *Salah list tugas?* Hubungi Pengurus.`;
            return rekap;
        };

        const sendToGroupSafe = async (content) => {
            await sock.sendPresenceUpdate('composing', ID_GRUP_TUJUAN);
            await delay(2000);
            await sock.sendMessage(ID_GRUP_TUJUAN, content);
        };

        // --- Perintah Utama ---
        switch (cmd) {
            case '!p': await sock.sendMessage(sender, { text: '✅ *Bot Aktif!*' }); break;
            case '!pr': await sock.sendMessage(sender, { text: formatRekap() }); break;
            
            case '!jadwal_baru':
                if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
                try {
                    await sock.sendMessage(sender, { text: "⏳ *Sedang menyelaraskan jadwal dengan constants.js...*" });
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
                    await sock.sendMessage(sender, { text: "✅ *SISTEM REFRESHED!*\nJadwal dan PR telah disinkronkan." });
                } catch (e) { await sock.sendMessage(sender, { text: "❌ Error: " + e.message }); }
                break;

            case '!update':
            case '!update_jadwal':
                if (!isAdmin) return await sock.sendMessage(sender, { text: nonAdminMsg });
                const daysUpdate = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
                let selectedDay = daysUpdate.find(d => body.toLowerCase().includes(d));
                
                if (!selectedDay) {
                    for (const h of daysUpdate) {
                        if (STRUKTUR_JADWAL[h].some(m => new RegExp(`\\b${m}\\b`, 'i').test(body))) {
                            selectedDay = h; break;
                        }
                    }
                }

                if (!selectedDay) return await sock.sendMessage(sender, { text: "❌ *HARI/MAPEL TIDAK ADA DI JADWAL*" });

                let mediaSection = "";
                if (msg.message.imageMessage || msg.message.documentMessage) {
                    const isImg = msg.message.imageMessage;
                    const buffer = await downloadMediaMessage(msg, 'buffer', {});
                    const fileName = `tugas_${Date.now()}${isImg ? '.jpg' : '.pdf'}`;
                    fs.writeFileSync(path.join(PUBLIC_PATH, fileName), buffer);
                    mediaSection = `\n━━━━━━━━━━━━━━━━━━━━\n🔗 Link Web File:\n${MY_DOMAIN}/tugas/${fileName}\n━━━━━━━━━━━━━━━━━━━━`;
                }

                let res = getProcessedTask(selectedDay, body + mediaSection);
                if (res) {
                    db.updateTugas(selectedDay, res);
                    if (cmd === '!update') {
                        await sendToGroupSafe({ text: `📌 *Update PR* 📢\n\n*\`📅 ${selectedDay.toUpperCase()}\`*\n\n${res}` });
                    }
                    await sock.sendMessage(sender, { text: `✅ Berhasil Update ${selectedDay}!` });
                }
                break;

            case '!deadline':
                if (args.length === 1) {
                    await sock.sendMessage(sender, { text: `⏳ *BELUM DIKUMPUL*\n\n${db.getAll().deadline || "Kosong"}` });
                } else {
                    if (!isAdmin) return;
                    db.updateTugas('deadline', body.slice(10).trim());
                    await sock.sendMessage(sender, { text: "✅ Deadline diperbarui!" });
                }
                break;

            case '!menu':
                await sock.sendMessage(sender, { text: "📖 *MENU BOT*\n\n🔹 !p, !pr, !deadline\n🔸 !update, !jadwal_baru, !hapus, !grup, !info" });
                break;

            case '!hapus':
                if (!isAdmin) return;
                const hDay = args[1]?.toLowerCase();
                const hMapel = args.slice(2).join(' ').toLowerCase();
                if (hDay === 'deadline') { db.updateTugas('deadline', ""); }
                else if (['senin', 'selasa', 'rabu', 'kamis', 'jumat'].includes(hDay)) {
                    if (hMapel === 'semua') db.updateTugas(hDay, "");
                    else {
                        let filtered = (db.getAll()[hDay] || "").split('\n\n').filter(e => !e.toLowerCase().includes(hMapel));
                        db.updateTugas(hDay, filtered.join('\n\n'));
                    }
                }
                await sock.sendMessage(sender, { text: "✅ Berhasil dihapus!" });
                break;

            case '!grup':
                if (isAdmin) await sendToGroupSafe({ text: formatRekap() });
                break;
        }
    } catch (err) { console.error("Error:", err); }
}

module.exports = { handleMessages };
