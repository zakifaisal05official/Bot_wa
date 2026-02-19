// views/dashboard.js
const os = require("os");

const renderDashboard = (isConnected, qrCodeData, botConfig, stats, logs, port) => {
    const usedRAM = ((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(2);
    const uptime = (os.uptime() / 3600).toFixed(1);

    const commonHead = `
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
            body { background: #ffffff; color: #333; font-family: 'Segoe UI', sans-serif; }
            .card { background: #ffffff; border: 1px solid #f0f0f0; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.04); }
            
            /* Tombol Pemicu Menu */
            .btn-trigger-menu { 
                background: #007bff; color: white; border: none; padding: 15px; 
                border-radius: 12px; font-weight: bold; width: 100%; 
                transition: 0.3s; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 10px;
            }
            .btn-trigger-menu:hover { background: #0056b3; }

            /* Layout Menu yang Muncul (Hidden by Default) */
            #layoutMenu { 
                display: none; 
                margin-top: 20px; 
                padding: 20px; 
                background: #f8f9fa; 
                border-radius: 15px;
                border: 1px solid #eee;
                animation: fadeIn 0.4s ease-in-out;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .feature-item { 
                display: flex; justify-content: space-between; align-items: center; 
                padding: 12px 0; border-bottom: 1px solid #e9ecef; 
            }
            .feature-item:last-child { border-bottom: none; }

            /* Teks Putih pada Tombol ON/OFF */
            .btn-toggle { 
                border: none; padding: 7px 18px; border-radius: 8px; font-weight: bold; 
                min-width: 75px; color: #ffffff !important; font-size: 0.8rem;
            }
            .btn-on { background: #28a745; }
            .btn-off { background: #dc3545; }

            .log-box { 
                background: #1e1e1e; color: #dcdcdc; border-radius: 12px; height: 250px; 
                overflow-y: auto; padding: 15px; font-family: 'Courier New', monospace; font-size: 0.85rem;
            }
            .stats-card { background: #f8f9fa; border: 1px solid #eee; border-radius: 12px; padding: 10px; }
            .stats-val { color: #007bff; font-weight: 800; font-size: 1.1rem; display: block; }
            .stats-lbl { color: #999; font-size: 0.65rem; text-transform: uppercase; font-weight: bold; }
        </style>
    `;

    if (isConnected) {
        return `
            <html>
                <head><title>Panel Kendali Bot</title>${commonHead}</head>
                <body class="py-5">
                    <div class="container" style="max-width: 500px;">
                        <div class="card p-4">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <div><h4 class="mb-0 fw-bold">SYTEAM PANEL</h4><small class="text-success fw-bold">Online</small></div>
                                <div class="text-muted small">Port: ${port}</div>
                            </div>

                            <button class="btn-trigger-menu" onclick="toggleMenu()">
                                🛠️ KONFIGURASI FITUR
                            </button>

                            <div id="layoutMenu">
                                <div class="feature-item">
                                    <span class="fw-bold">Quiz Scheduler</span>
                                    <a href="/toggle/quiz"><button class="btn-toggle ${botConfig.quiz ? 'btn-on' : 'btn-off'}">${botConfig.quiz ? 'ON' : 'OFF'}</button></a>
                                </div>
                                <div class="feature-item">
                                    <span class="fw-bold">Jadwal Besok</span>
                                    <a href="/toggle/jadwalBesok"><button class="btn-toggle ${botConfig.jadwalBesok ? 'btn-on' : 'btn-off'}">${botConfig.jadwalBesok ? 'ON' : 'OFF'}</button></a>
                                </div>
                                <div class="feature-item">
                                    <span class="fw-bold">Smart Feedback</span>
                                    <a href="/toggle/smartFeedback"><button class="btn-toggle ${botConfig.smartFeedback ? 'btn-on' : 'btn-off'}">${botConfig.smartFeedback ? 'ON' : 'OFF'}</button></a>
                                </div>
                                <div class="feature-item">
                                    <span class="fw-bold">PR Mingguan</span>
                                    <a href="/toggle/prMingguan"><button class="btn-toggle ${botConfig.prMingguan ? 'btn-on' : 'btn-off'}">${botConfig.prMingguan ? 'ON' : 'OFF'}</button></a>
                                </div>
                                <button class="btn btn-sm btn-outline-secondary w-100 mt-3" onclick="toggleMenu()">Tutup</button>
                            </div>

                            <hr class="my-4">

                            <div class="row g-2 mb-4 text-center">
                                <div class="col-3"><div class="stats-card"><span class="stats-lbl">RAM</span><span class="stats-val">${usedRAM}G</span></div></div>
                                <div class="col-3"><div class="stats-card"><span class="stats-lbl">UPTIME</span><span class="stats-val">${uptime}H</span></div></div>
                                <div class="col-3"><div class="stats-card"><span class="stats-lbl">CHAT</span><span class="stats-val">${stats.pesanMasuk}</span></div></div>
                                <div class="col-3"><div class="stats-card"><span class="stats-lbl">LOGS</span><span class="stats-val">${stats.totalLog}</span></div></div>
                            </div>

                            <div class="log-box mb-4">${logs.map(l => `<div class="mb-1">${l}</div>`).join('')}</div>
                            
                            <button class="btn btn-light w-100 fw-bold border" onclick="location.reload()">🔄 REFRESH DATA</button>
                        </div>
                    </div>

                    <script>
                        function toggleMenu() {
                            const menu = document.getElementById('layoutMenu');
                            if (menu.style.display === 'none' || menu.style.display === '') {
                                menu.style.display = 'block';
                            } else {
                                menu.style.display = 'none';
                            }
                        }
                    </script>
                </body>
            </html>
        `;
    }

    // Tampilan jika QR tersedia
    if (qrCodeData) {
        return `<html><head>${commonHead}</head><body class="d-flex align-items-center justify-content-center vh-100">
            <div class="card p-5 text-center" style="max-width: 400px;">
                <h5 class="fw-bold mb-4">SCAN WHATSAPP</h5>
                <img src="${qrCodeData}" class="img-fluid border rounded p-2 mb-3">
                <p class="text-muted small">Silakan scan untuk menghubungkan bot.</p>
            </div>
            <script>setTimeout(() => location.reload(), 15000);</script>
        </body></html>`;
    }

    return `<html><head>${commonHead}</head><body class="d-flex align-items-center justify-content-center vh-100"><h4>Memuat Sistem...</h4></body></html>`;
};

module.exports = { renderDashboard };
    
