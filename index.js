const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore,
    delay 
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const QRCode = require("qrcode");
const os = require("os"); 
const path = require("path");

// --- IMPORT DARI HANDLER & SCHEDULER (Hanya bagian ini yang disesuaikan) ---
const { handleMessages } = require('./handler'); 
const { 
    initQuizScheduler, 
    initJadwalBesokScheduler, 
    initSmartFeedbackScheduler,
    getWeekDates 
} = require('./scheduler'); 

// Objek kuisAktif harus didefinisikan agar bisa digunakan bersama antara index, handler, dan scheduler
let kuisAktif = { msgId: null, data: null, votes: {}, targetJam: null, tglID: null };

const app = express();
const port = process.env.PORT || 3000;
let qrCodeData = ""; 
let isConnected = false; 
let sock; 
let isStarting = false; // Flag untuk mencegah multiple instansi start()

// --- 1. WEB SERVER UI ---
app.get("/", (req, res) => {
    res.setHeader('Content-Type', 'text/html');

    // Kalkulasi RAM yang lebih akurat
    const totalMemBytes = os.totalmem();
    const freeMemBytes = os.freemem();
    const usedMemBytes = totalMemBytes - freeMemBytes;
    
    const totalRAM = (totalMemBytes / (1024 ** 3)).toFixed(2);
    const usedRAM = (usedMemBytes / (1024 ** 3)).toFixed(2);
    const uptime = (os.uptime() / 3600).toFixed(1);

    if (isConnected) {
        return res.send(`
            <html>
                <head>
                    <title>Bot Status</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                    <style>
                        body { background: #075e54; display: flex; align-items: center; justify-content: center; min-height: 100vh; color: white; margin: 0; font-family: sans-serif; }
                        .card { background: white; color: #333; border-radius: 15px; padding: 2rem; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3); width: 90%; max-width: 450px; }
                        .dot { height: 15px; width: 15px; background-color: #25d366; border-radius: 50%; display: inline-block; margin-right: 10px; animation: pulse 1.5s infinite; }
                        .info-box { background: #f8f9fa; border-radius: 10px; padding: 10px; margin-top: 10px; text-align: left; font-size: 0.9rem; }
                        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <div class="d-flex align-items-center justify-content-center mb-3">
                            <span class="dot"></span>
                            <h2 class="mb-0">BOT ONLINE</h2>
                        </div>
                        <p class="text-muted">Sesi aktif. Bot siap menerima perintah.</p>
                        <div class="info-box">
                            <p class="mb-1"><strong>Memory:</strong> ${usedRAM}GB / ${totalRAM}GB</p>
                            <p class="mb-1"><strong>Server Uptime:</strong> ${uptime} Jam</p>
                            <p class="mb-0"><strong>Platform:</strong> ${os.platform()} (${os.arch()})</p>
                        </div>
                        <hr>
                        <button class="btn btn-success w-100" onclick="location.reload()">Refresh Info</button>
                    </div>
                </body>
            </html>
        `);
    }

    if (qrCodeData) {
        res.send(`
            <html>
                <head>
                    <title>Scan WhatsApp</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                    <style>
                        body { background: #f0f2f5; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; }
                        .card { border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); padding: 30px; text-align: center; background: white; max-width: 400px; }
                        img { width: 100%; border: 1px solid #ddd; border-radius: 10px; padding: 10px; background: #fff; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h4 class="mb-4 text-primary">Scan QR Code</h4>
                        <img src="${qrCodeData}" />
                        <p class="mt-3 text-secondary small">Buka WhatsApp > Perangkat Tertaut > Scan QR ini</p>
                        <script>setTimeout(() => { location.reload(); }, 15000);</script>
                    </div>
                </body>
            </html>
        `);
    } else {
        res.send(`<div style="text-align:center; padding-top: 50px; font-family:sans-serif;"><h3>Memuat QR Code...</h3><p>Tunggu sebentar atau refresh halaman.</p><script>setTimeout(() => { location.reload(); }, 5000);</script></div>`);
    }
});

app.listen(port, "0.0.0.0", () => {
    console.log(`🌐 Dashboard: http://localhost:${port}`);
});

// --- 2. LOGIKA WHATSAPP ---

async function start() {
    if (isStarting) return; // Cegah double start
    isStarting = true;

    try {
        const { version } = await fetchLatestBaileysVersion();
        // Menggunakan path absolute untuk menghindari EBUSY di beberapa environment
        const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'auth_info'));

        sock = makeWASocket({
            version,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
            },
            logger: pino({ level: "silent" }),
            printQRInTerminal: false, // Diubah ke false (sudah dihandle via Web UI)
            browser: ["Ubuntu", "Chrome", "20.0.0.4"],
            getMessage: async (key) => {
                return { conversation: undefined }
            }
        });

        sock.ev.on("creds.update", saveCreds);

        // --- HANDLE VOTE POLLING ---
        sock.ev.on('messages.update', async (updates) => {
            for (const update of updates) {
                if (update.update.pollUpdates && kuisAktif && kuisAktif.msgId === update.key.id) {
                    const pollUpdate = update.update.pollUpdates[0];
                    if (pollUpdate) {
                        kuisAktif.votes[pollUpdate.voterJid] = pollUpdate.selectedOptions;
                    }
                }
            }
        });

        sock.ev.on('call', async (node) => {
            for (const call of node) {
                if (call.status === 'offer') {
                    try {
                        await sock.rejectCall(call.id, call.from);
                        const callerId = call.from.split('@')[0];
                        console.log(`📞 Panggilan dari ${callerId} otomatis ditolak.`);
                        await sock.sendMessage(call.from, { 
                            text: "⚠️ *BOT TIDAK MENERIMA PANGGILAN*\n\nMaaf, bot otomatis menolak telepon/video call. Silakan hubungi via chat saja." 
                        });
                    } catch (e) { /* ignore */ }
                }
            }
        });

        sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                qrCodeData = await QRCode.toDataURL(qr);
                isConnected = false;
            }

            if (connection === "close") {
                isConnected = false;
                qrCodeData = "";
                isStarting = false;
                const reason = lastDisconnect?.error?.output?.statusCode;
                
                console.log(`📡 Koneksi Terput as. Alasan: ${reason}`);
                
                if (reason !== DisconnectReason.loggedOut) {
                    console.log("🔄 Mencoba menyambung kembali dalam 5 detik...");
                    setTimeout(start, 5000);
                } else {
                    console.log("❌ Sesi keluar. Silakan hapus folder auth_info dan scan ulang.");
                }
            } else if (connection === "open") {
                qrCodeData = ""; 
                isConnected = true;
                isStarting = false;
                console.log("🎊 [BERHASIL] Bot sudah online!");
                
                // Beri jeda 2 detik agar state benar-benar stabil sebelum scheduler jalan
                await delay(2000);
                initQuizScheduler(sock, kuisAktif);
                initJadwalBesokScheduler(sock);
                initSmartFeedbackScheduler(sock, kuisAktif); 
            }
        });

        sock.ev.on("messages.upsert", async (m) => {
            if (m.type === 'notify') {
                try {
                    // Menyertakan kuisAktif dan utils agar handler tetap bisa berjalan sesuai struktur aslinya
                    await handleMessages(sock, m, kuisAktif, { getWeekDates });
                } catch (err) {
                    console.error("❌ Error saat handle pesan:", err);
                }
            }
        });

    } catch (err) {
        console.error("❌ ERROR UTAMA:", err);
        isStarting = false;
        setTimeout(start, 5000);
    }
}

// Jalankan bot
start();
