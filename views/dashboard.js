// views/dashboard.js
const os = require("os");

const renderDashboard = (isConnected, qrCodeData, botConfig, stats, logs, port, profilePic) => {
    const usedRAM = ((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(2);
    const uptime = (os.uptime() / 3600).toFixed(1);

    // Koleksi 8 Emoji Mood (Hanya wajah)
    const moodEmojis = ["😅", "🤣", "😁", "😕", "🤫", "😆", "😗", "😂"];
    const randomMood = moodEmojis[Math.floor(Math.random() * moodEmojis.length)];

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
            .card-custom { background: #1f2c33; border: 1px solid #2a3942; border-radius: 30px; box-shadow: 0 25px 50px rgba(0,0,0,0.8); position: relative; overflow: hidden; }
            
            /* Animasi Emoji Mood (Gerak Lirik & Ketawa) */
            @keyframes moodSwing {
                0% { transform: scale(1) rotate(0deg); }
                20% { transform: scale(1.1) rotate(-8deg); }
                40% { transform: translateX(-5px) rotate(0deg); }
                60% { transform: translateX(5px) rotate(0deg); }
                80% { transform: scale(1.1) rotate(8deg); }
                100% { transform: scale(1) rotate(0deg); }
            }

            .profile-section { text-align: center; margin-bottom: 20px; }
            .mood-avatar { 
                font-size: 55px; width: 100px; height: 100px; 
                background: rgba(0, 168, 132, 0.1);
                border: 3px solid #00a884; border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                margin: 0 auto 12px; transition: 0.5s;
                box-shadow: 0 0 25px rgba(0, 168, 132, 0.3);
                cursor: pointer;
                animation: moodSwing 5s infinite ease-in-out;
            }
            .mood-avatar:hover { animation-play-state: paused; transform: scale(1.2); }

            .quote-container {
                background: rgba(0, 168, 132, 0.08); border-left: 4px solid #00a884;
                padding: 15px; margin: 20px 0; border-radius: 15px;
                animation: backInDown 1.2s;
            }
            .quote-text { font-style: italic; font-size: 0.85rem; color: #d1d7db; line-height: 1.5; }

            .btn-action-area { display: flex; justify-content: center; margin: 15px 0; }
            .btn-neon-pill {
                background: rgba(0, 168, 132, 0.05); border: 2px solid #00a884;
                color: #00a884; padding: 8px 30px; border-radius: 50px;
                font-weight: 800; font-size: 0.8rem; letter-spacing: 1px;
                display: flex; align-items: center; gap: 10px;
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                cursor: pointer; box-shadow: 0 0 10px rgba(0, 168, 132, 0.2);
                text-transform: uppercase;
            }
            .btn-neon-pill:hover, .btn-neon-pill.active {
                background: #00a884; color: white; transform: scale(1.05);
                box-shadow: 0 0 20px rgba(0, 168, 132, 0.5);
            }

            #layoutMenu { 
                display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
                max-height: 0; opacity: 0; overflow: hidden;
                transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            }
            #layoutMenu.show { max-height: 1000px; opacity: 1; margin-top: 20px; padding: 5px; }

            .menu-card { background: #26353d; border: 1px solid #3b4a54; border-radius: 18px; padding: 12px; text-align: center; }
            .menu-card span { font-size: 0.65rem; font-weight: 800; display: block; margin-bottom: 8px; color: #8696a0; }

            /* Animasi ON/OFF Mulus */
            .btn-toggle { 
                border: none; width: 100%; padding: 6px; border-radius: 12px; 
                font-weight: 800; font-size: 0.75rem; 
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
            }
            .btn-on { background: #25d366; color: white; box-shadow: 0 4px 12px rgba(37,211,102,0.3); transform: scale(1.02); }
            .btn-off { background: #3b4a54; color: #aebac1; opacity: 0.8; }
            .btn-toggle:active { transform: scale(0.9); }
            
            .stats-card { background: #2a3942; border-radius: 18px; padding: 12px; text-align: center; transition: 0.3s; }
            .stats-card:hover { transform: translateY(-5px); border-color: #00a884; }
            .stats-v { color: #00a884; font-weight: 800; display: block; font-size: 1.1rem; }
            .stats-l { font-size: 0.6rem; color: #8696a0; text-transform: uppercase; }

            .log-box { 
                background: #000; color: #00ff41 !important; border-radius: 18px; 
                height: 180px; overflow-y: auto; padding: 15px; font-family: 'Consolas', monospace; 
                font-size: 0.75rem; border: 1px solid #333; box-shadow: inset 0 0 10px #000;
            }

            .footer-tag { font-size: 0.75rem; color: #8696a0; text-align: center; margin-top: 30px; border-top: 1px solid #2a3942; padding-top: 15px; }
            .zaki-name { color: #00a884; font-weight: bold; text-decoration: none; }
        </style>
    `;

    if (isConnected) {
        return `
            <html>
                <head><title>Synectic Core</title>${commonHead}</head>
                <body class="py-4">
                    <div class="container animate__animated animate__fadeIn" style="max-width: 480px;">
                        <div class="card-custom p-4">
                            
                            <div class="profile-section">
                                <div class="mood-avatar" onclick="location.reload()">
                                    ${randomMood}
                                </div>
                                <h4 style="color:#00a884; margin:0; font-weight:800; letter-spacing:2px;">SYNECTIC <span style="color:#fff">CORE</span></h4>
                                <div class="badge bg-success mt-2 animate__animated animate__pulse animate__infinite" style="font-size:0.6rem; border-radius:8px;">● ENGINE ACTIVE</div>
                            </div>

                            <div class="quote-container">
                                <div class="small text-success fw-bold mb-1" style="font-size:0.6rem; letter-spacing:1px;">CORE FEELING: ${randomMood}</div>
                                <span class="quote-text">"${randomQuote}"</span>
                            </div>

                            <div class="btn-action-area">
                                <div id="mainBtn" class="btn-neon-pill" onclick="toggleMenu()">
                                    <span>⚙️ SYSTEM CONFIG</span>
                                </div>
                            </div>

                            <div id="layoutMenu">
                                <div class="menu-card"><span>Quiz Bot</span><a href="/toggle/quiz"><button class="btn-toggle ${botConfig.quiz ? 'btn-on' : 'btn-off'}">${botConfig.quiz ? 'ACTIVE' : 'OFF'}</button></a></div>
                                <div class="menu-card"><span>Feedback</span><a href="/toggle/smartFeedback"><button class="btn-toggle ${botConfig.smartFeedback ? 'btn-on' : 'btn-off'}">${botConfig.smartFeedback ? 'ACTIVE' : 'OFF'}</button></a></div>
                                <div class="menu-card"><span>Jadwal</span><a href="/toggle/jadwalBesok"><button class="btn-toggle ${botConfig.jadwalBesok ? 'btn-on' : 'btn-off'}">${botConfig.jadwalBesok ? 'ACTIVE' : 'OFF'}</button></a></div>
                                <div class="menu-card"><span>PR Info</span><a href="/toggle/prMingguan"><button class="btn-toggle ${botConfig.prMingguan ? 'btn-on' : 'btn-off'}">${botConfig.prMingguan ? 'ACTIVE' : 'OFF'}</button></a></div>
                                <div class="menu-card" style="grid-column: span 2;"><span>Sahur Reminder</span><a href="/toggle/sahur"><button class="btn-toggle ${botConfig.sahur ? 'btn-on' : 'btn-off'}">${botConfig.sahur ? 'ACTIVE' : 'OFF'}</button></a></div>
                                <button class="btn btn-sm btn-dark w-100 mt-2" style="grid-column: span 2; border-radius:15px; font-weight:700;" onclick="toggleMenu()">EXIT CONFIG</button>
                            </div>

                            <div class="row g-2 mt-3 text-center">
                                <div class="col-3"><div class="stats-card"><span class="stats-l">RAM</span><span class="stats-v">${usedRAM}G</span></div></div>
                                <div class="col-3"><div class="stats-card"><span class="stats-l">UPTIME</span><span class="stats-v">${uptime}H</span></div></div>
                                <div class="col-3"><div class="stats-card"><span class="stats-l">CHAT</span><span class="stats-v">${stats.pesanMasuk}</span></div></div>
                                <div class="col-3"><div class="stats-card"><span class="stats-l">LOGS</span><span class="stats-v">${stats.totalLog}</span></div></div>
                            </div>

                            <div class="mt-4 mb-2 small fw-bold d-flex justify-content-between" style="color:#8696a0">
                                <span>LIVE ENGINE LOGS:</span>
                                <span style="cursor:pointer" class="text-success" onclick="location.reload()">REFRESH</span>
                            </div>
                            <div class="log-box" id="logBox">${logs.join('<br>')}</div>

                            <div class="footer-tag">
                                CORE OPERATED BY <a href="#" class="zaki-name">ZAKI</a>
                            </div>
                        </div>
                    </div>
                    <script>
                        function toggleMenu() {
                            const m = document.getElementById('layoutMenu');
                            const b = document.getElementById('mainBtn');
                            m.classList.toggle('show');
                            b.classList.toggle('active');
                        }
                        const bBox = document.getElementById('logBox');
                        bBox.scrollTop = bBox.scrollHeight;
                    </script>
                </body>
            </html>
        `;
    }

    if (qrCodeData) {
        return `<html><head>${commonHead}</head><body class="d-flex align-items-center justify-content-center vh-100"><div class="card-custom p-5 text-center" style="max-width:400px;"><h5 class="mb-4 text-white fw-bold">SCAN WHATSAPP</h5><div class="p-3 bg-white rounded-4 shadow-lg"><img src="${qrCodeData}" class="img-fluid"></div></div><script>setTimeout(()=>location.reload(),10000)</script></body></html>`;
    }

    return `<html><head>${commonHead}</head><body class="d-flex align-items-center justify-content-center vh-100"><div class="text-center"><div class="spinner-border text-success" style="width: 3rem; height: 3rem;"></div><div class="mt-3 text-muted fw-bold">CORE INITIALIZING...</div></div></body></html>`;
};

module.exports = { renderDashboard };
                                             
