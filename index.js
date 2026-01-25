const puppeteer = require('puppeteer');
const { handleMessage } = require('./handler');

(async () => {
    console.log("🚀 Memulai Bot Mode Pairing (Tanpa Scan QR)...");
    
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

    console.log("🌐 Membuka: https://web.whatsapp.org");
    await page.goto('https://web.whatsapp.org', { waitUntil: 'networkidle2', timeout: 0 });

    // --- FITUR PAIRING CODE ---
    try {
        console.log("📨 Mencoba memicu 'Link with phone number'...");
        
        // Tunggu tombol "Link with phone number" muncul
        await page.waitForSelector('span[role="button"]', { timeout: 15000 }).catch(() => {});
        
        // Klik tombol link dengan nomor (otomatis mencari teks "Link with phone number")
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('span'));
            const linkButton = buttons.find(el => el.innerText.includes('Link with phone number'));
            if (linkButton) linkButton.click();
        });

        console.log("📍 Silakan masukkan nomor HP kamu di Variables Railway (Contoh: 62812xxx)");
        console.log("Atau bot akan menunggu kamu memasukkannya manual di browser jika bisa...");
        
    } catch (e) {
        console.log("⚠️ Tidak bisa memicu pairing code, tetap menunggu QR...");
    }

    // --- TETAP TAMPILKAN QR JIKA PAIRING GAGAL ---
    const qrcode = require('qrcode-terminal');
    setInterval(async () => {
        const qrData = await page.evaluate(() => {
            const el = document.querySelector('div[data-ref]');
            return el ? el.getAttribute('data-ref') : null;
        });
        if (qrData) {
            console.log("👉 SCAN QR DIBAWAH JIKA TIDAK PAKAI PAIRING CODE:");
            qrcode.generate(qrData, { small: true });
        }
    }, 10000);

    // --- HANDLER PESAN ---
    const client = { pupPage: page };
    setInterval(async () => {
        try {
            const unread = await page.evaluate(() => {
                const nodes = document.querySelectorAll('.message-in.unread');
                return Array.from(nodes).map(n => {
                    n.classList.remove('unread');
                    return { body: n.querySelector('.copyable-text')?.innerText, from: "User" };
                });
            });
            for (const msg of unread) if (msg.body) await handleMessage(client, msg);
        } catch (err) {}
    }, 5000);

})();
