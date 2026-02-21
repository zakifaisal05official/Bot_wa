// views/dashboard.js
const os = require("os");

const renderDashboard = (isConnected, qrCodeData, botConfig, stats, logs, port) => {
    const usedRAM = ((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(2);
    const uptime = (os.uptime() / 3600).toFixed(1);

    const commonHead = `
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
        <style>
            body { background: #0b141a; color: #e9edef; font-family: 'Segoe UI', sans-serif; overflow-x: hidden; }
            .card { background: #1f2c33; border: 1px solid #2a3942; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            
            /* Animasi & Profil Section */
            .profile-section { text-align: center; margin-bottom: 20px; }
            .profile-img { width: 80px; height: 80px; border-radius: 50%; border: 3px solid #00a884; padding: 3px; margin-bottom: 10px; transition: transform 0.3s; }
            .profile-img:hover { transform: scale(1.1) rotate(5deg); }
            
            .btn-config { 
                background: linear-gradient(45deg, #00a884, #05cd9c); 
                color: white; border: none; padding: 12px; border-radius: 12px; 
                font-weight: bold; width: 100%; transition: 0.3s;
            }
            .btn-config:hover { opacity: 0.9; transform: translateY(-2px); }

            #layoutMenu { 
                display: none; background: #26353d; border-radius: 15px; 
                padding: 15px; margin-top: 15px; border: 1px solid #3b4a54;
                animation: fadeInDown 0.4s;
            }

            .menu-row { 
                display: flex; justify-content: space-between; align-items: center; 
                padding: 12px 0; border-bottom: 1px solid #3b4a54; 
                color: #ffffff !important; font-weight: 600;
            }

            .log-container { 
                background: #000000; color: #00ff41 !important; /* Green matrix style */
                border-radius: 12px; height: 200px; overflow-y: auto; 
                padding: 15px; font-family: 'Consolas', monospace; 
                font-size: 0.8rem; border: 1px solid #333;
            }

            .btn-toggle { border: none; padding: 5px 12px; border-radius: 20px; font-weight: 800; color: #fff !important; min-width: 65px; font-size: 0.75rem; transition: 0.3s; }
            .btn-on { background: #25d366; box-shadow: 0 0 10px rgba(37, 211, 102, 0.4); }
            .btn-off { background: #f15c5c; }
            
            .stats-box { background: #2a3942; border: 1px solid #3b4a54; border-radius: 12px; padding: 10px; transition: 0.3s; }
            .stats-box:hover { background: #32444e; border-color: #00a884; }
            .stats-label { font-size: 0.6rem; color: #8696a0; text-transform: uppercase; letter-spacing: 1px; }
            .stats-val { color: #00a884; font-weight: bold; display: block; font-size: 1.1rem; }

            .footer-credit { font-size: 0.75rem; color: #8696a0; text-align: center; margin-top: 20px; }
            .creator-name { color: #00a884; font-weight: bold; text-decoration: none; }
            
            /* Custom Scrollbar */
            ::-webkit-scrollbar { width: 5px; }
            ::-webkit-scrollbar-thumb { background: #3b4a54; border-radius: 10px; }
        </style>
    `;

    if (isConnected) {
        return `
            <html>
                <head><title>Syteam Dashboard</title>${commonHead}</head>
                <body class="py-4">
                    <div class="container animate__animated animate__fadeInUp" style="max-width: 500px;">
                        <div class="card p-4">
                            <div class="profile-section">
                                <img src="https://ui-avatars.com/api/?name=Syteam+Bot&background=00a884&color=fff" alt="Bot Profile" class="profile-img">
                                <h4 style="color:#00a884; margin:0;">SYTEAM <b>BOT</b></h4>
                                <p class="small text-muted mb-0">WhatsApp Automation Active</p>
                                <span class="badge bg-success mt-2" style="box-shadow: 0 0 15px rgba(37,211,102,0.5)">● ONLINE</span>
                            </div>

                            <button class="btn-config" onclick="toggleMenu()">🛠 PENGATURAN FITUR</button>

                            <div id="layoutMenu">
                                <div class="menu-row"><span>Quiz Scheduler</span><a href="/toggle/quiz"><button class="btn-toggle ${botConfig.quiz ? 'btn-on' : 'btn-off'}">${botConfig.quiz ? 'ON' : 'OFF'}</button></a></div>
                                <div class="menu-row"><span>Smart Feedback</span><a href="/toggle/smartFeedback"><button class="btn-toggle ${botConfig.smartFeedback ? 'btn-on' : 'btn-off'}">${botConfig.smartFeedback ? 'ON' : 'OFF'}</button></a></div>
                                <div class="menu-row"><span>Jadwal Besok</span><a href="/toggle/jadwalBesok"><button class="btn-toggle ${botConfig.jadwalBesok ? 'btn-on' : 'btn-off'}">${botConfig.jadwalBesok ? 'ON' : 'OFF'}</button></a></div>
                                <div class="menu-row"><span>PR Mingguan</span><a href="/toggle/prMingguan"><button class="btn-toggle ${botConfig.prMingguan ? 'btn-on' : 'btn-off'}">${botConfig.prMingguan ? 'ON' : 'OFF'}</button></a></div>
                                <div class="menu-row"><span>Sahur Reminder</span><a href="/toggle/sahur"><button class="btn-toggle ${botConfig.sahur ? 'btn-on' : 'btn-off'}">${botConfig.sahur ? 'ON' : 'OFF'}</button></a></div>
                                <button class="btn btn-sm btn-dark w-100 mt-2" style="border-radius:8px" onclick="toggleMenu()">Tutup</button>
                            </div>

                            <div class="row g-2 mt-3">
                                <div class="col-3 text-center"><div class="stats-box"><span class="stats-label">RAM</span><span class="stats-val">${usedRAM}G</span></div></div>
                                <div class="col-3 text-center"><div class="stats-box"><span class="stats-label">UPTIME</span><span class="stats-val">${uptime}H</span></div></div>
                                <div class="col-3 text-center"><div class="stats-box"><span class="stats-label">CHAT</span><span class="stats-val">${stats.pesanMasuk}</span></div></div>
                                <div class="col-3 text-center"><div class="stats-box"><span class="stats-label">LOGS</span><span class="stats-val">${stats.totalLog}</span></div></div>
                            </div>

                            <div class="mt-4 mb-2 small fw-bold d-flex justify-content-between" style="color:#8696a0">
                                <span>LOG AKTIVITAS:</span>
                                <span style="cursor:pointer" onclick="location.reload()">🔄 Refresh</span>
                            </div>
                            <div class="log-container" id="logBox">${logs.join('<br>')}</div>

                            <div class="footer-credit">
                                Made with ❤️ by <a href="#" class="creator-name">Zaki</a>
                            </div>
                        </div>
                    </div>
                    <script>
                        function toggleMenu() {
                            const m = document.getElementById('layoutMenu');
                            m.style.display = (m.style.display === 'block') ? 'none' : 'block';
                        }
                        // Auto scroll log to bottom
                        const logBox = document.getElementById('logBox');
                        logBox.scrollTop = logBox.scrollHeight;
                    </script>
                </body>
            </html>
        `;
    }

    if (qrCodeData) {
        return `<html><head>${commonHead}</head><body class="d-flex align-items-center justify-content-center vh-100"><div class="card p-5 text-center animate__animated animate__zoomIn" style="max-width:400px;"><h5 class="mb-4 text-white">SCAN WHATSAPP</h5><div class="p-3 bg-white rounded shadow-sm"><img src="${qrCodeData}" class="img-fluid"></div><p class="mt-4 small text-muted">Buka WhatsApp > Perangkat Tertaut > Tautkan Perangkat</p></div><script>setTimeout(()=>location.reload(),10000)</script></body></html>`;
    }

    return `<html><head>${commonHead}</head><body class="d-flex align-items-center justify-content-center vh-100"><div class="text-center"><div class="spinner-border text-success mb-3" style="width: 3rem; height: 3rem;"></div><div class="text-muted">Menyiapkan Dashboard...</div></div></body></html>`;
};

module.exports = { renderDashboard };
                                                                                                                                                                                                
