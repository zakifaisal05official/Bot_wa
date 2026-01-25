const puppeteer = require('puppeteer');
const qrcode = require('qrcode-terminal');
const { handleMessage } = require('./handler');

(async () => {
    console.log("🚀 Memulai Bot...");
    
    const browser = await puppeteer.launch({
        headless: "new",
        ignoreHTTPSErrors: true, // Bypass error SSL
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--ignore-certificate-errors'
        ]
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

    console.log("🌐 Membuka WhatsApp Web...");
    // Gunakan timeout: 0 agar tidak error saat internet lambat
    await page.goto('https://web.whatsapp.org', { waitUntil: 'networkidle2', timeout: 0 });

    console.log("🔍 Mencari QR Code...");

    // Cek QR terus menerus
    setInterval(async () => {
        try {
            const qrData = await page.evaluate(() => {
                const el = document.querySelector('div[data-ref]');
                return el ? el.getAttribute('data-ref') : null;
            });

            if (qrData) {
                console.log("--------------------------");
                console.log("✅ SCAN QR DI BAWAH INI:");
                qrcode.generate(qrData, { small: true });
                console.log("--------------------------");
            }
        } catch (e) {}
    }, 10000);

    // Cek Pesan Masuk
    setInterval(async () => {
        try {
            const unread = await page.evaluate(() => {
                const nodes = document.querySelectorAll('.message-in.unread');
                return Array.from(nodes).map(n => {
                    n.classList.remove('unread');
                    return {
                        body: n.querySelector('.copyable-text')?.innerText,
                        from: "User" 
                    };
                });
            });

            for (const msg of unread) {
                if (msg.body) await handleMessage({ pupPage: page }, msg);
            }
        } catch (err) {}
    }, 5000);
})();
