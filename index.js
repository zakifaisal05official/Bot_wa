const puppeteer = require('puppeteer');
const qrcode = require('qrcode-terminal'); // Tambahkan ini
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
                '--ignore-certificate-errors',
                '--ignore-certificate-errors-spki-list'
            ]
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

        console.log("🌐 Membuka WhatsApp Web...");
        
        await page.goto('https://web.whatsapp.org', {
            waitUntil: 'networkidle0',
            timeout: 0
        }).catch(e => console.log("⚠️ Info: Sedang memuat halaman..."));

        // --- LOGIKA DETEKSI & TAMPILKAN QR CODE ---
        console.log("🔍 Menunggu QR Code muncul...");
        
        let qrLogged = false;
        const checkQR = setInterval(async () => {
            try {
                // Mengambil data string dari canvas QR WhatsApp
                const qrData = await page.evaluate(() => {
                    const selector = 'div[data-ref]';
                    const element = document.querySelector(selector);
                    return element ? element.getAttribute('data-ref') : null;
                });

                if (qrData && !qrLogged) {
                    console.log("✅ QR CODE DITEMUKAN! SCAN SEKARANG:");
                    // Menampilkan QR di log terminal
                    qrcode.generate(qrData, { small: true });
                    qrLogged = true;
                } else if (!qrData) {
                    qrLogged = false; // Reset jika QR berubah/refresh
                }
            } catch (e) {}
        }, 3000);

        const client = { pupPage: page };

        // Cek pesan masuk setiap 5 detik
        setInterval(async () => {
            try {
                const unread = await page.evaluate(() => {
                    const nodes = document.querySelectorAll('.message-in.unread');
                    return Array.from(nodes).map(n => {
                        // Menandai pesan sebagai terbaca agar tidak diproses berulang
                        n.classList.remove('unread');
                        return {
                            body: n.querySelector('.copyable-text')?.innerText,
                            from: "User" 
                        };
                    });
                });

                for (const msg of unread) {
                    if (msg.body) {
                        console.log(`📩 Pesan baru diterima: ${msg.body}`);
                        await handleMessage(client, msg);
                    }
                }
            } catch (err) {}
        }, 5000);

    } catch (e) {
        console.error("❌ Error Fatal:", e.message);
    }
})();
