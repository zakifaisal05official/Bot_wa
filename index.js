const puppeteer = require('puppeteer');
const qrcode = require('qrcode-terminal');
const { handleMessage } = require('./handler');

(async () => {
    console.log("🚀 Memulai Bot di Railway...");
    
    try {
        const browser = await puppeteer.launch({
            headless: "new",
            ignoreHTTPSErrors: true, 
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--ignore-certificate-errors'
            ]
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

        console.log("🌐 Membuka Link WhatsApp Web: https://web.whatsapp.org");
        
        await page.goto('https://web.whatsapp.org', {
            waitUntil: 'networkidle2',
            timeout: 0 
        });

        console.log("🔍 Menunggu QR Code...");
        
        let lastQR = "";
        setInterval(async () => {
            try {
                const qrData = await page.evaluate(() => {
                    const el = document.querySelector('div[data-ref]');
                    return el ? el.getAttribute('data-ref') : null;
                });

                if (qrData && qrData !== lastQR) {
                    lastQR = qrData;
                    console.clear();
                    console.log("========================================");
                    console.log("✅ QR CODE DITEMUKAN!");
                    console.log("========================================");
                    
                    // Tampilkan QR versi Gambar (Karakter)
                    qrcode.generate(qrData, { small: true });
                    
                    console.log("========================================");
                    console.log("🔗 LINK DATA QR (Copy & Paste ke Generator jika perlu):");
                    console.log(qrData);
                    console.log("========================================");
                }
            } catch (e) {}
        }, 7000);

        // Sisanya adalah handler pesan (tetap sama)
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
                for (const msg of unread) {
                    if (msg.body) await handleMessage(client, msg);
                }
            } catch (err) {}
        }, 5000);

    } catch (e) {
        console.error("❌ Error Fatal:", e.message);
    }
})();
