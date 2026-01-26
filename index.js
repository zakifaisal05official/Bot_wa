const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const QRCode = require("qrcode");
const { handleMessages } = require('./handler'); // Mengambil logika dari handler.js

const app = express();
const port = process.env.PORT || 3000;
let qrCodeData = ""; 

// Web Server untuk menampilkan QR di Browser
app.get("/", (req, res) => {
    if (qrCodeData) {
        res.send(`
            <html>
                <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#25d366;font-family:sans-serif;">
                    <div style="background:white;padding:20px;border-radius:15px;box-shadow:0 10px 25px rgba(0,0,0,0.1);">
                        <h2 style="color:#075e54;text-align:center;">Scan QR Bot WhatsApp</h2>
                        <img src="${qrCodeData}" style="width:300px;height:300px;"/>
                        <p style="text-align:center;color:#666;">Refresh jika QR tidak muncul atau kadaluwarsa</p>
                    </div>
                </body>
            </html>
        `);
    } else {
        res.send("<h2 style='text-align:center;font-family:sans-serif;'>Bot sudah terhubung atau sedang memproses koneksi...</h2>");
    }
});

app.listen(port, () => console.log(`🌐 Web QR ready on port ${port}`));

async function start() {
    // Menggunakan folder 'session_web_qr' agar sesi tersimpan aman
    const { state, saveCreds } = await useMultiFileAuthState('session_web_qr');
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false, // QR hanya tampil di Web Link Railway
        browser: ["Chrome (Linux)", "Chrome", "110.0.0"]
    });

    sock.ev.on("creds.update", saveCreds);

    // Kirim pesan masuk ke handler.js
    sock.ev.on("messages.upsert", async (m) => {
        await handleMessages(sock, m);
    });

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrCodeData = await QRCode.toDataURL(qr);
            console.log("✅ QR Baru tersedia di link website Railway kamu!");
        }

        if (connection === "close") {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("⚠️ Koneksi terputus. Mencoba menghubungkan kembali:", shouldReconnect);
            if (shouldReconnect) start();
        } else if (connection === "open") {
            qrCodeData = ""; // Hapus data QR jika sudah login
            console.log("🎊 BOT BERHASIL TERHUBUNG & HANDLER AKTIF!");
        }
    });
}

start();
