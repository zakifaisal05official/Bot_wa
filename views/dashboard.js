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
            
            .btn-config { 
                background: #00a884; color: white; border: none; padding: 12px; 
                border-radius: 10px; font-weight: bold; width: 100%; transition: 0.3s;
            }
            .btn-config:hover { background: #008f72; box-shadow: 0 0 15px rgba(0, 168, 132, 0.4); }

            #layoutMenu { 
                display: none; background: #2a3942; border-radius: 12px; 
                padding: 15px; margin-top: 15px; border: 1px solid #3b4a54;
                animation: slideDown 0.3s ease-out;
            }
            @keyframes slideDown { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }

            /* PERUBAHAN DISINI: Teks label menu jadi putih */
            .menu-row { 
                display: flex; justify-content: space-between; align-items: center; 
                padding: 10px 0; border-bottom: 1px solid #3b4a54; 
                color: #ffffff !important; 
                font-weight: 500;
            }
            .menu-row:last-child { border-bottom: none; }

            .btn-toggle { border: none; padding: 6px 15px; border-radius: 6px; font-weight: 800; font-size: 0.75rem; color: #fff !important; min-width: 70px; }
            .btn-on { background: #25d366; }
            .btn-off { background: #f15c5c; }

            .log-container { background: #0c1317; border-radius: 10px; height: 250px; overflow-y: auto; padding: 10px; font-family: monospace; font-size: 0.8rem; border: 1px solid #2a3942; }
            .stats-box { background: #2a3942; border-radius: 10px; padding: 10px; border: 1px solid #3b4a54; }
            .stats-label { font-size: 0.65rem; color: #8696a0; text-transform: uppercase; font-weight: bold; }
            .stats-val { font-size: 1rem; color: #00a884; font-weight: bold; display: block; }
        </style>
    `;

    if (isConnected) {
        return `
            <html>
                <head><title>Syteam Bot Dark</title>${commonHead}</head>
                <body class="py-4">
                    <div class="container" style="max-width: 500px;">
                        <div class="card p-4 shadow-lg">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <div><h4 class="mb-0" style="color:#00a884">SYTEAM <b>BOT</b></h4><small style="color:#8696a0">Status: Terhubung</small></div>
                                <div style="height:12px; width:12px; background:#25d366; border-radius:50%; box-shadow: 0 0 10px #25d366"></div>
                            </div>

                            <button class="btn-config" onclick="toggleMenu()">🛠 PENGATURAN FITUR</button>

                            <div id="layoutMenu">
                                <div class="menu-row"><span>Quiz Scheduler</span><a href="/toggle/quiz"><button class="btn-toggle ${botConfig.quiz ? 'btn-on' : 'btn-off'}">${botConfig.quiz ? 'ON' : 'OFF'}</button></a></div>
                                <div class="menu-row"><span>Smart Feedback</span><a href="/toggle/smartFeedback"><button class="btn-toggle ${botConfig.smartFeedback ? 'btn-on' : 'btn-off'}">${botConfig.smartFeedback ? 'ON' : 'OFF'}</button></a></div>
                                <div class="menu-row"><span>Jadwal Besok</span><a href="/toggle/jadwalBesok"><button class="btn-toggle ${botConfig.jadwalBesok ? 'btn-on' : 'btn-off'}">${botConfig.jadwalBesok ? 'ON' : 'OFF'}</button></a></div>
                                <div class="menu-row"><span>PR Mingguan</span><a href="/toggle/prMingguan"><button class="btn-toggle ${botConfig.prMingguan ? 'btn-on' : 'btn-off'}">${botConfig.prMingguan ? 'ON' : 'OFF'}</button></a></div>
                                <button class="btn btn-sm btn-dark w-100 mt-2" style="font-size: 0.7rem; border:1px solid #3b4a54" onclick="toggleMenu()">Tutup</button>
                            </div>

                            <div class="row g-2 mt-4 text-center">
                                <div class="col-3"><div class="stats-box"><span class="stats-label">RAM</span><span class="stats-val">${usedRAM}G</span></div></div>
                                <div class="col-3"><div class="stats-box"><span class="stats-label">UPTIME</span><span class="stats-val">${uptime}H</span></div></div>
                                <div class="col-3"><div class="stats-box"><span class="stats-label">CHAT</span><span class="stats-val">${stats.pesanMasuk}</span></div></div>
                                <div class="col-3"><div class="stats-box"><span class="stats-label">LOGS</span><span class="stats-val">${stats.totalLog}</span></div></div>
                            </div>

                            <div class="mt-4 mb-2 small fw-bold" style="color:#8696a0">KONSOL AKTIVITAS:</div>
                            <div class="log-container mb-3">${logs.join('<br>')}</div>

                            <button class="btn btn-sm btn-outline-secondary w-100" onclick="location.reload()">REFRESH DASHBOARD</button>
                        </div>
                    </div>
                    <script>
                        function toggleMenu() {
                            const m = document.getElementById('layoutMenu');
                            m.style.display = (m.style.display === 'block') ? 'none' : 'block';
                        }
                    </script>
                </body>
            </html>`;
    }

    if (qrCodeData) {
        return `<html><head>${commonHead}</head><body class="d-flex align-items-center justify-content-center vh-100"><div class="card p-5 text-center" style="max-width: 400px; background:#1f2c33; border: 1px solid #2a3942;"><h5 class="mb-4">SCAN WHATSAPP</h5><div class="p-3 bg-white rounded"><img src="${qrCodeData}" class="img-fluid"></div><p class="mt-3 small text-muted">Scan QR untuk menghubungkan.</p></div><script>setTimeout(()=>location.reload(),10000)</script></body></html>`;
    }

    return `<html><head>${commonHead}</head><body class="d-flex align-items-center justify-content-center vh-100"><div class="text-center"><div class="spinner-border text-success mb-3"></div><h5>SYSTEM LOADING...</h5></div></body></html>`;
};

module.exports = { renderDashboard };
                                                                                                                                                                                       
