// views/dashboard.js
const os = require("os");

// Tambahkan parameter profilePic di sini
const renderDashboard = (isConnected, qrCodeData, botConfig, stats, logs, port, profilePic) => {
    const usedRAM = ((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(2);
    const uptime = (os.uptime() / 3600).toFixed(1);

    // Jika profilePic tidak ada/error, gunakan avatar default
    const displayPic = profilePic || `https://ui-avatars.com/api/?name=Syteam+Bot&background=00a884&color=fff`;

    const quotes = [
        "Tetap fokus, hasil tidak akan mengkhianati proses!",
        "Coding adalah seni, dan kamu adalah senimannya.",
        "Jangan berhenti saat lelah, berhentilah saat selesai.",
        "Error adalah cara kode mengatakan: 'Ajari aku lebih baik'.",
        "Jadikan hari ini lebih baik dari kemarin!",
        "Bekerja keraslah dalam diam, biarkan botmu yang berisik!"
    ];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

    const commonHead = `
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
        <style>
            body { background: #0b141a; color: #e9edef; font-family: 'Segoe UI', sans-serif; overflow-x: hidden; }
            .card { background: #1f2c33; border: 1px solid #2a3942; border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.6); position: relative; }
            
            .profile-section { text-align: center; margin-bottom: 20px; }
            .profile-img { 
                width: 90px; height: 90px; border-radius: 50%; 
                border: 3px solid #00a884; padding: 3px; 
                margin-bottom: 10px; transition: 0.5s; object-fit: cover;
                box-shadow: 0 0 15px rgba(0, 168, 132, 0.4);
            }
            .profile-img:hover { transform: scale(1.1); border-color: #25d366; }
            
            .btn-config { 
                background: linear-gradient(135deg, #00a884, #05cd9c); 
                color: white; border: none; padding: 12px; border-radius: 12px; 
                font-weight: bold; width: 100%; transition: 0.3s; box-shadow: 0 4px 15px rgba(0,168,132,0.3);
            }

            #layoutMenu { 
                max-height: 0; overflow: hidden; transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                opacity: 0; background: #26353d; border-radius: 15px;
            }
            #layoutMenu.show { 
                max-height: 600px; opacity: 1; margin-top: 15px; padding: 15px; border: 1px solid #3b4a54;
            }

            .menu-row { 
                display: flex; justify-content: space-between; align-items: center; 
                padding: 12px 0; border-bottom: 1px solid #3b4a54; color: #fff; font-weight: 600;
            }

            .log-container { 
                background: #000; color: #00ff41 !important; border-radius: 12px; 
                height: 180px; overflow-y: auto; padding: 15px; font-family: 'Consolas', monospace; 
                font-size: 0.8rem; border: 1px solid #333;
            }

            .btn-toggle { border: none; padding: 5px 12px; border-radius: 20px; font-weight: 800; color: #fff !important; min-width: 65px; font-size: 0.75rem; transition: 0.3s; }
            .btn-on { background: #25d366; }
            .btn-off { background: #f15c5c; }
            
            .stats-box { background: #2a3942; border: 1px solid #3b4a54; border-radius: 12px; padding: 10px; }
            .stats-val { color: #00a884; font-weight: bold; display: block; font-size: 1.1rem; }

            .quote-box { 
                background: rgba(0, 168, 132, 0.1); border-left: 4px solid #00a884; 
                padding: 12px; margin: 15px 0; border-radius: 8px; 
                font-style: italic; font-size: 0.85rem; color: #d1d7db;
                animation: fadeInRight 1s;
            }
            
            .footer-credit { font-size: 0.8rem; color: #8696a0; text-align: center; margin-top: 25px; border-top: 1px solid #2a3942; padding-top: 15px; }
            .creator-name { color: #00a884; font-weight: bold; text-decoration: none; }
        </style>
    `;

    if (isConnected) {
        return `
            <html>
                <head><title>Syteam Dashboard</title>${commonHead}</head>
                <body class="py-4">
                    <div class="container animate__animated animate__fadeIn" style="max-width: 500px;">
                        <div class="card p-4">
                            <div class="profile-section">
                                <img src="${displayPic}" class="profile-img" onerror="this.src='https://ui-avatars.com/api/?name=Bot'">
                                <h4 style="color:#00a884; margin:0; letter-spacing:1px;">SYTEAM <b>BOT</b></h4>
                                <span class="badge bg-success mt-2">● ONLINE</span>
                            </div>

                            <div class="quote-box">
                                "${randomQuote}"
                            </div>

                            <button class="btn-config" onclick="toggleMenu()">🛠 PENGATURAN FITUR</button>

                            <div id="layoutMenu">
                                <div class="menu-row"><span>Quiz Scheduler</span><a href="/toggle/quiz"><button class="btn-toggle ${botConfig.quiz ? 'btn-on' : 'btn-off'}">${botConfig.quiz ? 'ON' : 'OFF'}</button></a></div>
                                <div class="menu-row"><span>Smart Feedback</span><a href="/toggle/smartFeedback"><button class="btn-toggle ${botConfig.smartFeedback ? 'btn-on' : 'btn-off'}">${botConfig.smartFeedback ? 'ON' : 'OFF'}</button></a></div>
                                <div class="menu-row"><span>Jadwal Besok</span><a href="/toggle/jadwalBesok"><button class="btn-toggle ${botConfig.jadwalBesok ? 'btn-on' : 'btn-off'}">${botConfig.jadwalBesok ? 'ON' : 'OFF'}</button></a></div>
                                <div class="menu-row"><span>PR Mingguan</span><a href="/toggle/prMingguan"><button class="btn-toggle ${botConfig.prMingguan ? 'btn-on' : 'btn-off'}">${botConfig.prMingguan ? 'ON' : 'OFF'}</button></a></div>
                                <div class="menu-row"><span>Sahur Reminder</span><a href="/toggle/sahur"><button class="btn-toggle ${botConfig.sahur ? 'btn-on' : 'btn-off'}">${botConfig.sahur ? 'ON' : 'OFF'}</button></a></div>
                                <button class="btn btn-sm btn-outline-light w-100 mt-3" style="border-radius:10px" onclick="toggleMenu()">Tutup Menu</button>
                            </div>

                            <div class="row g-2 mt-3 text-center">
                                <div class="col-3"><div class="stats-box"><span class="stats-label small text-muted">RAM</span><span class="stats-val">${usedRAM}G</span></div></div>
                                <div class="col-3"><div class="stats-box"><span class="stats-label small text-muted">UP</span><span class="stats-val">${uptime}H</span></div></div>
                                <div class="col-3"><div class="stats-box"><span class="stats-label small text-muted">MSG</span><span class="stats-val">${stats.pesanMasuk}</span></div></div>
                                <div class="col-3"><div class="stats-box"><span class="stats-label small text-muted">LOG</span><span class="stats-val">${stats.totalLog}</span></div></div>
                            </div>

                            <div class="mt-4 mb-2 small fw-bold d-flex justify-content-between" style="color:#8696a0">
                                <span>LOG AKTIVITAS</span>
                                <span style="cursor:pointer" class="text-success" onclick="location.reload()">Refresh</span>
                            </div>
                            <div class="log-container" id="logBox">${logs.join('<br>')}</div>

                            <div class="footer-credit">
                                Pembuat: <a href="#" class="creator-name">Zaki</a>
                            </div>
                        </div>
                    </div>
                    <script>
                        function toggleMenu() {
                            const m = document.getElementById('layoutMenu');
                            m.classList.toggle('show');
                        }
                        const logBox = document.getElementById('logBox');
                        logBox.scrollTop = logBox.scrollHeight;
                    </script>
                </body>
            </html>
        `;
    }

    if (qrCodeData) {
        return `<html><head>${commonHead}</head><body class="d-flex align-items-center justify-content-center vh-100"><div class="card p-5 text-center animate__animated animate__zoomIn" style="max-width:400px;"><h5 class="mb-4 text-white">SCAN WHATSAPP</h5><div class="p-3 bg-white rounded shadow-lg"><img src="${qrCodeData}" class="img-fluid"></div></div><script>setTimeout(()=>location.reload(),10000)</script></body></html>`;
    }

    return `<html><head>${commonHead}</head><body class="d-flex align-items-center justify-content-center vh-100"><div class="text-center"><div class="spinner-border text-success"></div></div></body></html>`;
};

module.exports = { renderDashboard };
                                                                                                                                             
