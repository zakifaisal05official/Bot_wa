const { default: makeWASocket, useMultiFileAuthState, delay, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const QRCode = require("qrcode");
const app = express();
const port = process.env.PORT || 3000;

let qrCodeData = ""; // Tempat simpan QR

// Membuat Web Server untuk menampilkan QR di Browser
app.get("/", async (req, res) => {
    if (qrCodeData) {
        res.send(`
            <html>
                <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#25d366;font-family:sans-serif;">
                    <div style="background:white;padding:20px;border-radius:15px;box-shadow:0 10px 25px rgba(0,0,0,0.1);">
                        <h2 style="color:#075e54;text-align:center;">Scan QR Bot WhatsApp</h2>
                        <img src="${qrCodeData}" style="width:300px;height:300px;"/>
                        <p style="text-align:center;color:#666;">Refresh halaman jika QR tidak muncul</p>
                    </div>
                </body>
            </html>
        `);
    } else {
        res.send("<h2>QR belum siap, silakan tunggu atau refresh halaman...</h2>");
    }
});

app.listen(port, () => console.log(`Server jalan di port ${port}`));

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('session_web_qr');
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false, // Mati di terminal
        browser: ["Chrome (Linux)", "Chrome", "110.0.0"]
    });

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            // Ubah kode QR jadi gambar (Data URL) untuk ditampilkan di web
            qrCodeData = await QRCode.toDataURL(qr);
            console.log("✅ QR Code Baru telah dibuat! Buka link Railway kamu di Chrome PC.");
        }

        if (connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) start();
        } else if (connection === "open") {
            qrCodeData = ""; // Hapus QR setelah login
            console.log("🎊 BOT TERHUBUNG!");
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

start();
