// views/dashboard.js
const os = require("os");

const renderDashboard = (isConnected, qrCodeData, botConfig, stats, logs, port, profilePic) => {
    const usedRAM = ((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(2);
    const uptime = (os.uptime() / 3600).toFixed(1);

    const displayPic = profilePic || `https://ui-avatars.com/api/?name=Syteam+Bot&background=00a884&color=fff`;

    const quotes = [
        "Tetap fokus, hasil tidak akan mengkhianati proses!",
        "Coding adalah seni, dan kamu adalah senimannya.",
        "Jangan berhenti saat lelah, berhentilah saat selesai.",
        "Error adalah cara kode mengatakan: 'Ajari aku lebih baik'.",
        "Jadikan hari ini lebih baik dari kemarin!",
        "Satu baris kode hari ini, satu langkah menuju sukses.",
        "Bekerja keraslah dalam diam, biarkan botmu yang berisik!"
    ];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

    const commonHead = `
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
        <style>
            body { background: #0b141a; color: #e9edef; font-family: 'Segoe UI', sans-serif; overflow-x: hidden; }
            .card-custom { background: #1f2c33; border: 1px solid #2a3942; border-radius: 25px; box-shadow: 0 20px 40px rgba(0,0,0,0.7); position: relative; overflow: hidden; }
            
            /* Profil Styling */
            .profile-section { text-align: center; margin-bottom: 20px; }
            .profile-img { 
                width: 95px; height: 95px; border-radius: 50%; 
                border: 3px solid #00a884; padding: 4px; 
                margin-bottom: 12px; transition: 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); object-fit: cover;
                box-shadow: 0 0 20px rgba(0, 168, 132, 0.3);
            }
            .profile-img:hover { transform: rotate(10deg) scale(1.1); }
            
            /* Quote Box Baru (Fix Tidak Muncul) */
            .quote-container {
                background: linear-gradient(90deg, rgba(0,168,132,0.1) 0%, rgba(37,211,102,0.05) 100%);
                border-left: 4px solid #00a884;
                padding: 15px;
                margin: 20px 0;
                border-radius: 12px;
                position: relative;
                z-index: 10;
                animation: backInLeft 1s;
            }
            .quote-text { font-style: italic; font-size: 0.88rem; color: #e9edef; line-height: 1.5; display: block; }
            .quote-label { font-size: 0.65rem; font-weight: 900; color: #00a884; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 5px; }

            /* Tombol Control Panel */
            .btn-main-config { 
                background: linear-gradient(135deg, #00a884 0%, #05cd9c 100%); 
                color: white; border: none; padding: 14px; border-radius: 15px; 
                font-weight: 800; width: 100%; transition: 0.3s; 
                box-shadow: 0 8px 15px rgba(0,168,132,0.2);
                letter-spacing: 1px;
            }
            .btn-main-config:active { transform: scale(0.98); }

            /* Menu Grid System (2 Kolom) */
            #layoutMenu { 
                display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
                max-height: 0; opacity: 0; overflow: hidden;
                transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            }
            #layoutMenu.show { 
                max-height: 800px; opacity: 1; margin-top: 20px; padding: 5px;
            }

            .menu-card {
                background: #26353d; border: 1px solid #3b4a54; border-radius: 15px;
                padding: 12px; text-align: center; transition: 0.3s;
            }
            .menu-card span { font-size: 0.7rem; font-weight: 700; display: block; margin-bottom: 8px; color: #8696a0; text-transform: uppercase; }

            .btn-toggle { border: none; width: 100%; padding: 6px; border-radius: 10px; font-weight: 800; font-size: 0.75rem; transition: 0.3s; }
            .btn-on { background: #25d366; color: white; box-shadow: 0 4px 10px rgba(37,211,102,0.2); }
            .btn-off { background: #3b4a54; color: #aebac1; }
            
            /* Stats Box */
            .stats-card { background: #2a3942; border-radius: 15px; padding: 10px; border: 1px solid transparent; transition: 0.3s; }
            .stats-card:hover { border-color: #00a884; transform: translateY(-3px); }
            .stats-v { color: #00a884; font-weight: 800; display: block; font-size: 1.1rem; }
            .stats-l { font-size: 0.6rem; color: #8696a0; text-transform: uppercase; }

            .log-box { 
                background: #000; color: #00ff41 !important; border-radius: 15px; 
                height: 170px; overflow-y: auto; padding: 15px; font-family: 'Consolas', monospace; 
                font-size: 0.75rem; border: 1px solid #333; line-height: 1.6;
            }

            .footer-tag { font-size: 0.75rem; color: #8696a0; text-align: center; margin-top: 25px; }
            .zaki-name { color: #00a884; font-weight: bold; text-decoration: none; text-transform: uppercase; }

            ::-webkit-scrollbar { width: 4px; }
            ::-webkit-scrollbar-thumb { background: #00a884; border-radius: 10px; }
        </style>
    `;

    if (isConnected) {
        return `
            <html>
                <head><title>Syteam Dashboard</title>${commonHead}</head>
                <body class="py-4">
                    <div class="container animate__animated animate__fadeInUp" style="max-width: 480px;">
                        <div class="card-custom p-4">
                            
                            <div class="profile-section">
                                <img src="${displayPic}" class="profile-img" onerror="this.src='https://ui-avatars.com/api/?name=User'">
                                <h4 style="color:#00a884; margin:0; font-weight:800; letter-spacing:1px;">SYTEAM <span style="color:#fff">BOT</span></h4>
                                <div class="badge bg-success mt-2 animate__animated animate__pulse animate__infinite" style="font-size:0.65rem; border-radius:8px;">● ONLINE</div>
                            </div>

                            <div class="quote-container">
                                <span class="quote-label">Daily Motivation</span>
                                <span class="quote-text">"${randomQuote}"</span>
                            </div>

                            <button class="btn-main-config" onclick="toggleMenu()">🛠 PENGATURAN FITUR</button>

                            <div id="layoutMenu">
                                <div class="menu-card">
                                    <span>Quiz Bot</span>
                                    <a href="/toggle/quiz"><button class="btn-toggle ${botConfig.quiz ? 'btn-on' : 'btn-off'}">${botConfig.quiz ? 'ON' : 'OFF'}</button></a>
                                </div>
                                <div class="menu-card">
                                    <span>Smart Feedback</span>
                                    <a href="/toggle/smartFeedback"><button class="btn-toggle ${botConfig.smartFeedback ? 'btn-on' : 'btn-off'}">${botConfig.smartFeedback ? 'ON' : 'OFF'}</button></a>
                                </div>
                                <div class="menu-card">
                                    <span>Jadwal Besok</span>
                                    <a href="/toggle/jadwalBesok"><button class="btn-toggle ${botConfig.jadwalBesok ? 'btn-on' : 'btn-off'}">${botConfig.jadwalBesok ? 'ON' : 'OFF'}</button></a>
                                </div>
                                <div class="menu-card">
                                    <span>PR Mingguan</span>
                                    <a href="/toggle/prMingguan"><button class="btn-toggle ${botConfig.prMingguan ? 'btn-on' : 'btn-off'}">${botConfig.prMingguan ? 'ON' : 'OFF'}</button></a>
                                </div>
                                <div class="menu-card" style="grid-column: span 2;">
                                    <span>Sahur Reminder</span>
                                    <a href="/toggle/sahur"><button class="btn-toggle ${botConfig.sahur ? 'btn-on' : 'btn-off'}">${botConfig.sahur ? 'ON' : 'OFF'}</button></a>
                                </div>
                                <button class="btn btn-sm btn-dark w-100 mt-2" style="grid-column: span 2; border-radius:10px;" onclick="toggleMenu()">Tutup</button>
                            </div>

                            <div class="row g-2 mt-3 text-center">
                                <div class="col-3"><div class="stats-card"><span class="stats-l">RAM</span><span class="stats-v">${usedRAM}G</span></div></div>
                                <div class="col-3"><div class="stats-card"><span class="stats-l">UPTIME</span><span class="stats-v">${uptime}H</span></div></div>
                                <div class="col-3"><div class="stats-card"><span class="stats-l">CHAT</span><span class="stats-v">${stats.pesanMasuk}</span></div></div>
                                <div class="col-3"><div class="stats-card"><span class="stats-l">LOGS</span><span class="stats-v">${stats.totalLog}</span></div></div>
                            </div>

                            <div class="mt-4 mb-2 small fw-bold d-flex justify-content-between" style="color:#8696a0">
                                <span>LIVE LOG AKTIVITAS:</span>
                                <span style="cursor:pointer" class="text-success" onclick="location.reload()">REFRESH</span>
                            </div>
                            <div class="log-box" id="logBox">${logs.join('<br>')}</div>

                            <div class="footer-tag">
                                PEMBUAT: <a href="#" class="zaki-name">ZAKI</a>
                            </div>
                        </div>
                    </div>
                    <script>
                        function toggleMenu() {
                            const m = document.getElementById('layoutMenu');
                            m.classList.toggle('show');
                        }
                        const b = document.getElementById('logBox');
                        b.scrollTop = b.scrollHeight;
                    </script>
                </body>
            </html>
        `;
    }

    if (qrCodeData) {
        return `<html><head>${commonHead}</head><body class="d-flex align-items-center justify-content-center vh-100"><div class="card-custom p-5 text-center animate__animated animate__zoomIn" style="max-width:400px;"><h5 class="mb-4 text-white">SCAN WHATSAPP</h5><div class="p-3 bg-white rounded-4 shadow-lg"><img src="${qrCodeData}" class="img-fluid"></div></div><script>setTimeout(()=>location.reload(),10000)</script></body></html>`;
    }

    return `<html><head>${commonHead}</head><body class="d-flex align-items-center justify-content-center vh-100"><div class="text-center"><div class="spinner-grow text-success" style="width: 3rem; height: 3rem;"></div><div class="mt-3 fw-bold text-muted">MENYIAPKAN DATA...</div></div></body></html>`;
};

module.exports = { renderDashboard };
