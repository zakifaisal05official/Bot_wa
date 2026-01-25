const puppeteer = require('puppeteer');
const qrcode = require('qrcode-terminal');
const { handleMessage } = require('./handler');
const path = require('path');

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
                '--ignore-certificate-errors-spki-list',
                '--disable-extensions'
            ],
            // Menyimpan session agar tidak scan QR terus-menerus
            userDataDir: path.join(__dirname, 'session') 
        });

        const page = await browser.newPage();
        
        // Agar tidak terdeteksi sebagai bot
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

        console.log("🌐 Membuka WhatsApp Web...");
        
        await page.goto('https://web.whatsapp.org', {
            waitUntil: 'networkidle2', // Diubah dari networkidle0 agar lebih cepat
            timeout: 0 
        }).catch(() => console.log("⚠️ Sedang mencoba memuat ulang..."));

        console.log("🔍 Mengecek status (QR/Login)...");
        
        let qrLogged = false;
        const checkStatus = setInterval(async () => {
            try {
                // Cek apakah ada QR Code
                const qrData = await page.evaluate(() => {
                    const el = document.querySelector('div[data-ref]');
                    return el ? el.getAttribute('data-ref') : null;
                });

                if (qrData && !qrLogged) {
                    console.clear();
                    console.log("✅ QR CODE DITEMUKAN! SCAN SEKARANG:");
                    qrcode.generate(qrData, { small: true });
                    qrLogged = true;
                }

                // Cek apakah sudah masuk ke chat (Login berhasil)
                const isLoggedIn = await page.evaluate(() => {
                    return !!document.querySelector('div[data-tab="3"]');
                });

                if (isLoggedIn) {
                    console.log("🎊 LOGIN BERHASIL! Bot Siap Digunakan.");
                    clearInterval(checkStatus);
                }
            } catch (e) {}
        }, 5000);

        const client = { pupPage: page };

        // Logika Baca Pesan
        setInterval(async () => {
            try {
                const unreadMessages = await page.evaluate(() => {
                    // Selektor pesan unread yang lebih akurat
                    const nodes = document.querySelectorAll('.message-in.unread');
                    const results = [];
                    
                    nodes.forEach(n => {
                        const text = n.querySelector('.copyable-text')?.innerText;
                        if (text) {
                            results.push({ body: text, from: "User" });
                            n.classList.remove('unread'); // Hapus tanda unread di browser
                        }
                    });
                    return results;
                });

                for (const msg of unreadMessages) {
                    console.log(`📩 Pesan Masuk: ${msg.body}`);
                    await handleMessage(client, msg);
                }
            } catch (err) {}
        }, 3000); // Cek setiap 3 detik agar lebih responsif

    } catch (e) {
        console.error("❌ Error Fatal:", e.message);
    }
})();
