// views/dashboard.js
const os = require("os");

const renderDashboard = (isConnected, qrCodeData, botConfig, stats, logs, port) => {
    const usedRAM = ((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(2);
    const uptime = (os.uptime() / 3600).toFixed(1);

    return `
    <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
                body { background: #0b141a; color: #e9edef; font-family: 'Segoe UI', sans-serif; }
                .card { background: #1f2c33; border: 1px solid #2a3942; border-radius: 15px; }
                .btn-config { background: #00a884; color: white; border: none; padding: 12px; border-radius: 10px; font-weight: bold; width: 100%; }
                
                #layoutMenu { display: none; background: #2a3942; border-radius: 12px; padding: 15px; margin-top: 15px; border: 1px solid #3b4a54; }
                
                /* Teks Menu Putih */
                .menu-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #3b4a54; color: #ffffff !important; font-weight: 600; }
                
                /* Teks Log Putih */
                .log-container { background: #000000; color: #ffffff !important; border-radius: 10px; height: 250px; overflow-y: auto; padding: 15px; font-family: monospace; border: 1px solid #333; }
                
                .btn-toggle { border: none; padding: 6px 15px; border-radius: 8px; font-weight: bold; color: #fff !important; min-width: 75px; }
                .btn-on { background: #25d366; }
                .btn-off { background: #f15c5c; }
            </style>
        </head>
        <body class="py-4">
            <div class="container" style="max-width: 500px;">
                <div class="card p-4">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h4 style="color:#00a884;">SYTEAM BOT</h4>
                        <span class="badge ${isConnected ? 'bg-success' : 'bg-danger'}">${isConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
                    </div>

                    <button class="btn-config" onclick="toggleMenu()">🛠 PENGATURAN FITUR</button>

                    <div id="layoutMenu">
                        <div class="menu-row"><span>Quiz</span><a href="/toggle/quiz"><button class="btn-toggle ${botConfig.quiz ? 'btn-on' : 'btn-off'}">${botConfig.quiz ? 'ON' : 'OFF'}</button></a></div>
                        <div class="menu-row"><span>Jadwal</span><a href="/toggle/jadwalBesok"><button class="btn-toggle ${botConfig.jadwalBesok ? 'btn-on' : 'btn-off'}">${botConfig.jadwalBesok ? 'ON' : 'OFF'}</button></a></div>
                        <div class="menu-row"><span>Feedback</span><a href="/toggle/smartFeedback"><button class="btn-toggle ${botConfig.smartFeedback ? 'btn-on' : 'btn-off'}">${botConfig.smartFeedback ? 'ON' : 'OFF'}</button></a></div>
                        <div class="menu-row"><span>Sahur</span><a href="/toggle/sahur"><button class="btn-toggle ${botConfig.sahur ? 'btn-on' : 'btn-off'}">${botConfig.sahur ? 'ON' : 'OFF'}</button></a></div>
                        <button class="btn btn-sm btn-dark w-100 mt-2" onclick="toggleMenu()">Tutup</button>
                    </div>

                    <div class="mt-4 mb-2 small fw-bold" style="color:#8696a0">LOG:</div>
                    <div class="log-container">${logs.join('<br>')}</div>
                    
                    <button class="btn btn-outline-secondary w-100 mt-3 btn-sm" onclick="location.reload()">Refresh Dash</button>
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
};

module.exports = { renderDashboard };
