const fs = require('fs');

// ================= CONFIG =================
const ADMIN_RAW = ['6289531549103', '171425214255294'];
const NAMA_GRUP = '🎒Tugas & Jadwal Sekolah [Y.M.B] ✍️'; 
const DATA_FILE = './data.json';
const NOMOR_PENGURUS = '089531549103'; 

// ================= UTIL =================
function readData() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify({ senin: "", selasa: "", rabu: "", kamis: "", jumat: "" }, null, 2));
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function isAdminUser(sender) {
    if (!sender) return false;
    return ADMIN_RAW.some(num => sender.replace(/\D/g, '').includes(num));
}

function getWeekDates() {
    const now = new Date();
    const dayOfWeek = now.getDay(); 
    const diffToMonday = (dayOfWeek === 0 ? 1 : 1 - dayOfWeek);
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    const dates = [];
    for (let i = 0; i < 5; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        dates.push(`${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`);
    }
    return { dates, periode: `${dates[0]} - ${dates[4]}` };
}

async function replySafe(client, target, text) {
    try {
        const page = client.pupPage;
        let searchText = target.includes('@') ? target.replace(/\D/g, '') : target;
        const searchBox = 'div[contenteditable="true"][data-tab="3"]';
        await page.waitForSelector(searchBox);
        await page.click(searchBox);
        await page.keyboard.down('Control');
        await page.keyboard.press('A');
        await page.keyboard.up('Control');
        await page.keyboard.press('Backspace');
        await page.keyboard.type(searchText); 
        await new Promise(r => setTimeout(r, 2000));
        await page.keyboard.press('Enter'); 
        const chatBox = 'div[contenteditable="true"][data-tab="10"]';
        await page.waitForSelector(chatBox, { timeout: 8000 });
        await page.click(chatBox);
        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
            await page.keyboard.type(lines[i]);
            if (i < lines.length - 1) {
                await page.keyboard.down('Shift');
                await page.keyboard.press('Enter');
                await page.keyboard.up('Shift');
            }
        }
        await new Promise(r => setTimeout(r, 500));
        await page.keyboard.press('Enter'); 
    } catch (err) { console.log(`❌ Gagal kirim ke ${target}:`, err.message); }
}

// ================= MAIN HANDLER =================
async function handleMessage(client, msg) {
    const body = msg.body?.trim();
    if (!body) return;
    const sender = msg.from;
    const isAdmin = isAdminUser(sender);
    const db = readData();
    const { dates, periode } = getWeekDates();

    const triggers = ['p', 'pr', 'menu', 'update', 'hapus', 'grup', 'info'];
    if (!body.startsWith('!') && triggers.includes(body.toLowerCase())) {
        return await replySafe(client, sender, `⚠️ *Format Salah!*\n\nGunakan tanda seru (*!*) di depan perintah.\nContoh: *!menu*`);
    }
    if (!body.startsWith('!')) return;

    const formatRekap = () => `📌 *Daftar List Tugas PR Minggu Ini* 📢\n➝ ${periode}\n\n---------------------------------------------------------------------------------\n\n*📅 Senin* ➝ ${dates[0]}\n${db.senin || '➝ (Tidak ada PR)\n╰┈➤ 👍'}\n\n*📅 Selasa* ➝ ${dates[1]}\n${db.selasa || '➝ (Tidak ada PR)\n╰┈➤ 👍'}\n\n*📅 Rabu* ➝ ${dates[2]}\n${db.rabu || '➝ (Tidak ada PR)\n╰┈➤ 👍'}\n\n*📅 Kamis* ➝ ${dates[3]}\n${db.kamis || '➝ (Tidak ada PR)\n╰┈➤ 👍'}\n\n*📅 Jumat* ➝ ${dates[4]}\n${db.jumat || '➝ (Tidak ada PR)\n╰┈➤ 👍'}\n\n---------------------------------------------------------------------------------\n\n*semangat mengerjakan tugasnya! 🚀*`;

    const args = body.split(' ');
    const cmd = args[0].toLowerCase();

    if (cmd === '!p') return await replySafe(client, sender, '✅ *Bot Aktif!*');
    if (cmd === '!pr') return await replySafe(client, sender, formatRekap());
    if (cmd === '!menu') return await replySafe(client, sender, `📖 *Menu Bot*\n\n🔹 !p ➜ Cek Status\n🔹 !pr ➜ Rekap (Japri)\n\n⚙️ *Pengurus Only:*\n🔸 !grup ➜ Kirim Rekap ke Grup\n🔸 !info [pesan] ➜ Info Baru\n🔸 !update [hari] [isi] ➜ Update PR\n🔸 !hapus [hari] ➜ Hapus PR`);

    const adminCmds = ['!grup', '!update', '!hapus', '!info'];
    if (adminCmds.includes(cmd)) {
        if (!isAdmin) return await replySafe(client, sender, `🚫 *Akses Ditolak!*\n\nFitur ini khusus *Pengurus List Tugas*.\n\n💡 Hubungi: *${NOMOR_PENGURUS}*`);

        if (cmd === '!info') {
            const info = body.replace(/!info/i, '').trim();
            if (!info) return await replySafe(client, sender, '⚠️ *Isi Infonya!*');
            return await replySafe(client, NAMA_GRUP, `📢 *PENGUMUMAN INFO BARU* 📢\n\n${info}\n\n---------------------------------------------------------------------------------\n_Info dari: Pengurus List Tugas_`);
        }
        if (cmd === '!grup') return await replySafe(client, NAMA_GRUP, formatRekap());
        if (cmd === '!update') {
            const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
            let day = days.find(d => body.toLowerCase().includes(d));
            if (!day) return await replySafe(client, sender, '⚠️ *Format Salah!*');
            const val = body.split(day)[1]?.trim();
            if (!val) return await replySafe(client, sender, '⚠️ *Isi Kosong!*');
            db[day] = val;
            fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
            if (body.toLowerCase().includes('jadwal')) return await replySafe(client, sender, '✅ *Sistem Updated!*');
            return await replySafe(client, NAMA_GRUP, `📢 *UPDATE PR: ${day.toUpperCase()}*\n\n${val}\n\n_Cek list: *!pr*_`);
        }
        if (cmd === '!hapus') {
            const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
            let day = days.find(d => body.toLowerCase().includes(d));
            if (!day) return await replySafe(client, sender, '⚠️ *Pilih Hari!*');
            db[day] = "";
            fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
            return await replySafe(client, sender, `✅ *Dikosongkan!*`);
        }
    } else {
        return await replySafe(client, sender, `⚠️ *Perintah Tidak Dikenal!*\n\nKetik *!menu*.\n💡 Hubungi: *${NOMOR_PENGURUS}*`);
    }
}

module.exports = { handleMessage };
