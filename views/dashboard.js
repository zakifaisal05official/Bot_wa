// views/dashboard.js
const os = require("os");

const renderDashboard = (isConnected, qrCodeData, botConfig, stats, logs, port) => {
    const usedRAM = ((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(2);
    const uptime = (os.uptime() / 3600).toFixed(1);

    const commonHead = `
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
            body { background: #0b141a; color: #e9edef; font-family: 'Segoe UI', sans-serif; }
            .card { background: #1f2c33; border: 1px solid #2a3942; border-radius: 15px; }
            
            .btn-config { background: #00a884; color: white; border: none; padding: 12px; border-radius: 10px; font-weight: bold; width: 100%; }

            #layoutMenu { 
                display: none; background: #2a3942; border-radius: 12px; 
                padding: 15px; margin-top: 15px; border: 1px solid #3b4a54;
            }

            .menu-row { 
                display: flex; justify-content: space-between; align-items: center; 
                padding: 12px 0; border-bottom: 1px solid #3b4a54; 
                color: #ffffff !important; /* Tulisan Menu Jadi Putih */
                font-weight: 600;
            }

            .log-container { 
                background: #000000; 
                color: #ffffff !important; /* Tulisan Log Jadi Putih */
                border-radius: 10px; 
                height: 250px; 
                overflow-y: auto; 
                padding: 15px; 
                font-family: 'Consolas', monospace; 
                font-size: 0.85rem; 
                border: 1px solid #333;
                line-height: 1.6;
            }

            .btn-toggle { border: none; padding: 6px 15px; border-radius: 8px; font-weight: 800; color: #fff !important; min-width: 75px; }
            .btn-on { background: #25d366; }
            .btn-off { background: #f15c5c; }
            
            .stats-box { background: #2a3942; border: 1px solid #3b4a54; border-radius: 10px; padding: 10px; }
            .stats-label { font-size: 0.65rem; color: #8696a0; text-transform: uppercase; }
            .stats-val { color: #00a884; font-weight: bold; display: block; }
        </style>
    `;

    if (isConnected) {
        return `
            <html>
                <head><title>Syteam Dashboard</title>${commonHead}</head>
                <body class="py-4">
                    <div class="container" style="max-width: 500px;">
                        <div class="card p-4 shadow-lg">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <h4 style="color:#00a884; margin:0;">SYTEAM <b>BOT</b></h4>
                                <span class="badge bg-success" style="box-shadow: 0 0 10px #25d366">ONLINE</span>
                            </div>

                            <button class="btn-config" onclick="toggleMenu()">🛠 PENGATURAN FITUR</button>

                            <div id="layoutMenu">
                                <div class="menu-row"><span>Quiz Scheduler</span><a href="/toggle/quiz"><button class="btn-toggle ${botConfig.quiz ? 'btn-on' : 'btn-off'}">${botConfig.quiz ? 'ON' : 'OFF'}</button></a></div>
                                <div class="menu-row"><span>Smart Feedback</span><a href="/toggle/smartFeedback"><button class="btn-toggle ${botConfig.smartFeedback ? 'btn-on' : 'btn-off'}">${botConfig.smartFeedback ? 'ON' : 'OFF'}</button></a></div>
                                <div class="menu-row"><span>Jadwal Besok</span><a href="/toggle/jadwalBesok"><button class="btn-toggle ${botConfig.jadwalBesok ? 'btn-on' : 'btn-off'}">${botConfig.jadwalBesok ? 'ON' : 'OFF'}</button></a></div>
                                <div class="menu-row"><span>PR Mingguan</span><a href="/toggle/prMingguan"><button class="btn-toggle ${botConfig.prMingguan ? 'btn-on' : 'btn-off'}">${botConfig.prMingguan ? 'ON' : 'OFF'}</button></a></div>
                                <div class="menu-row"><span>Sahur Reminder</span><a href="/toggle/sahur"><button class="btn-toggle ${botConfig.sahur ? 'btn-on' : 'btn-off'}">${botConfig.sahur ? 'ON' : 'OFF'}</button></a></div>
                                <button class="btn btn-sm btn-dark w-100 mt-2" onclick="toggleMenu()">Tutup</button>
                            </div>

                            <div class="row g-2 mt-4">
                                <div class="col-3 text-center"><div class="stats-box"><span class="stats-label">RAM</span><span class="stats-val">${usedRAM}G</span></div></div>
                                <div class="col-3 text-center"><div class="stats-box"><span class="stats-label">UPTIME</span><span class="stats-val">${uptime}H</span></div></div>
                                <div class="col-3 text-center"><div class="stats-box"><span class="stats-label">CHAT</span><span class="stats-val">${stats.pesanMasuk}</span></div></div>
                                <div class="col-3 text-center"><div class="stats-box"><span class="stats-label">LOGS</span><span class="stats-val">${stats.totalLog}</span></div></div>
                            </div>

                            <div class="mt-4 mb-2 small fw-bold" style="color:#8696a0">LOG AKTIVITAS:</div>
                            <div class="log-container">${logs.join('<br>')}</div>

                            <button class="btn btn-outline-secondary w-100 mt-3 btn-sm" onclick="location.reload()">Refresh Halaman</button>
                        </div>
                    </div>
                    <script>
                        function toggleMenu() {
                            const m = document.getElementById('layoutMenu');
                            m.style.display = (m.style.display === 'block') ? 'none' : 'block';
                        }
                    </script>
                </body>
            </html>
        `;
    }

    // Bagian QR Code tetap sama
    if (qrCodeData) {
        return `<html><head>${commonHead}</head><body class="d-flex align-items-center justify-content-center vh-100"><div class="card p-5 text-center" style="max-width:400px; background:#1f2c33;"><h5 class="mb-4">SCAN WHATSAPP</h5><div class="p-3 bg-white rounded"><img src="${qrCodeData}" class="img-fluid"></div></div><script>setTimeout(()=>location.reload(),10000)</script></body></html>`;
    }

    return `<html><head>${commonHead}</head><body class="d-flex align-items-center justify-content-center vh-100"><div class="spinner-border text-success"></div></body></html>`;
};

module.exports = { renderDashboard };
