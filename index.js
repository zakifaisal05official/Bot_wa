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

        console.log("🌐 Membuka WhatsApp Web...");
        
        await page.goto('https://web.whatsapp.org', {
            waitUntil: 'networkidle0',
            timeout: 60000 
        }).catch(() => console.log("⚠️ Sedang mencoba menembus koneksi..."));

        console.log("🔍 Menunggu QR Code muncul di Logs...");
        
        let qrLogged = false;
        setInterval(async () => {
            try {
                const qrData = await page.evaluate(() => {
                    const el = document.querySelector('div[data-ref]');
                    return el ? el.getAttribute('data-ref') : null;
                });

                if (qrData && !qrLogged) {
                    console.log("✅ QR CODE DITEMUKAN! SCAN SEKARANG:");
                    qrcode.generate(qrData, { small: true });
                    qrLogged = true;
                } else if (!qrData) {
                    qrLogged = false; 
                }
            } catch (e) {}
        }, 5000);

        const client = { pupPage: page };

        // Cek pesan masuk
        setInterval(async () => {
            try {
                const unread = await page.evaluate(() => {
                    const nodes = document.querySelectorAll('.message-in.unread');
                    return Array.from(nodes).map(n => {
                        n.classList.remove('unread'); // Tandai terbaca
                        return {
                            body: n.querySelector('.copyable-text')?.innerText,
                            from: "User" 
                        };
                    });
                });

                for (const msg of unread) {
                    if (msg.body) {
                        console.log(`📩 Pesan: ${msg.body}`);
                        await handleMessage(client, msg);
                    }
                }
            } catch (err) {}
        }, 5000);

    } catch (e) {
        console.error("❌ Error Fatal:", e.message);
    }
})();
