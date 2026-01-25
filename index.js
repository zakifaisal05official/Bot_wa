const puppeteer = require('puppeteer');
const { handleMessage } = require('./handler');

(async () => {
    console.log("🚀 Memulai Bot di Railway...");
    
    try {
        const browser = await puppeteer.launch({
            headless: "new",
            ignoreHTTPSErrors: true, // Mengabaikan error SSL/Sertifikat
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--ignore-certificate-errors',
                '--ignore-certificate-errors-spki-list'
            ]
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

        console.log("🌐 Membuka WhatsApp Web...");
        
        // Membuka WA dengan penanganan error lebih kuat
        await page.goto('https://web.whatsapp.org', {
            waitUntil: 'networkidle0',
            timeout: 0
        }).catch(e => console.log("⚠️ Info: Terjadi kendala saat loading awal, tapi tetap mencoba..."));

        console.log("📸 Halaman termuat! Silakan scan QR Code di Logs.");
        
        const client = { pupPage: page };

        // Cek pesan masuk setiap 5 detik
        setInterval(async () => {
            try {
                const unread = await page.evaluate(() => {
                    const nodes = document.querySelectorAll('.message-in.unread');
                    return Array.from(nodes).map(n => ({
                        body: n.querySelector('.copyable-text')?.innerText,
                        from: "User" 
                    }));
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
