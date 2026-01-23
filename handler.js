/**
 * File ini berfungsi sebagai otak bot.
 * Semua logika balasan pesan ada di sini.
 */

async function handleMessage(client, msg) {
    try {
        // Mengubah pesan menjadi huruf kecil agar bot tidak sensitif huruf kapital
        const messageBody = msg.body.toLowerCase();
        const sender = msg.from;

        // 1. Perintah: !ping
        if (messageBody === '!ping') {
            await msg.reply('pong! Bot aktif di Railway 🚀');
        }

        // 2. Perintah: Halo / P / Hai
        else if (['halo', 'p', 'hai', 'hallo'].includes(messageBody)) {
            await client.sendMessage(sender, 'Halo! Saya adalah bot asisten otomatis. Ketik *!menu* untuk melihat perintah.');
        }

        // 3. Perintah: !menu
        else if (messageBody === '!menu') {
            const menuText = `
*DAFTAR PERINTAH BOT* 🤖

🔹 *!ping* - Cek status bot
🔹 *!info* - Informasi server
🔹 *!owner* - Kontak pemilik bot
🔹 *!sticker* - (Segera hadir)

_Ketik perintah tanpa tanda petik._
            `;
            await client.sendMessage(sender, menuText.trim());
        }

        // 4. Perintah: !info
        else if (messageBody === '!info') {
            await msg.reply('Bot ini menggunakan *whatsapp-web.js* dan dijalankan di server *Railway.app* yang stabil.');
        }

        // 5. Perintah: !owner
        else if (messageBody === '!owner') {
            await client.sendMessage(sender, 'Owner bot ini adalah kamu sendiri! 😎');
        }

    } catch (error) {
        console.error('Error saat memproses pesan:', error);
    }
}

// Mengekspor fungsi agar bisa dibaca oleh index.js
module.exports = { handleMessage };
  
