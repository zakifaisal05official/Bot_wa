const puppeteer = require('puppeteer');
const { handleMessage } = require('./handler');

(async () => {
    console.log("🚀 Menjalankan Browser...");
    const browser = await puppeteer.launch({
        headless: "new",
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
    
    console.log("🌐 Membuka WhatsApp Web...");
    await page.goto('https://web.whatsapp.org');

    // Menampilkan QR Code di Console Hugging Face
    console.log("📸 SILAKAN CEK LOG UNTUK SCAN QR CODE");
    
    // Simpan page ke client dummy agar bisa dipakai di handler
    const client = { pupPage: page };

    // Loop untuk membaca pesan baru
    setInterval(async () => {
        try {
            const newMsgs = await page.evaluate(() => {
                const msgs = document.querySelectorAll('.message-in.unread');
                return Array.from(msgs).map(m => {
                    const body = m.querySelector('.copyable-text')?.innerText;
                    const from = m.closest('.item-hints')?.querySelector('.chat-title')?.innerText;
                    return { body, from };
                });
            });

            for (let msg of newMsgs) {
                if (msg.body) {
                    await handleMessage(client, msg);
                }
            }
        } catch (e) {}
    }, 3000);

})();
