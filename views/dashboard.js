// views/dashboard.js
const os = require("os");

const renderDashboard = (isConnected, qrCodeData, botConfig, stats, logs, port, profilePic) => {
    const usedRAM = ((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(2);
    const uptime = (os.uptime() / 3600).toFixed(1);

    const moodEmojis = ["😅", "🤣", "😁", "😕", "🤫", "😆", "😗", "😂"];
    const randomMood = moodEmojis[Math.floor(Math.random() * moodEmojis.length)];

    const quotes = [
        "Tetap fokus, hasil tidak akan mengkhianati proses!",
        "Coding adalah seni, dan kamu adalah senimannya.",
        "Jangan berhenti saat lelah, berhentilah saat selesai.",
        "Error adalah cara kode mengatakan: Ajari aku lebih baik.",
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
            .card-custom { background: #1f2c33; border: 1px solid #2a3942; border-radius: 30px; box-shadow: 0 25px 50px rgba(0,0,0,0.8); position: relative; overflow: hidden; }
            
            @keyframes moodSwing {
                0% { transform: scale(1) rotate(0deg); }
                20% { transform: scale(1.1) rotate(-8deg); }
                40% { transform: translateX(-5px); }
                60% { transform: translateX(5px); }
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
                animation: moodSwing 5s infinite ease-in-out;
            }

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
                transition: 0.3s; cursor: pointer; text-transform: uppercase;
            }
            .btn-neon-pill.active { background: #00a884; color: white; box-shadow: 0 0 20px rgba(0, 168, 132, 0.5); }

            #layoutMenu { 
                display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
                max-height: 0; opacity: 0; overflow: hidden;
                transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            }
            #layoutMenu.show { max-height: 1000px; opacity: 1; margin-top: 20px; padding: 5px; }

            .menu-card { background: #26353d; border: 1px solid #3b4a54; border-radius: 18px; padding: 12px; text-align: center; }
            .menu-card span { font-size: 0.65rem; font-weight: 800; display: block; margin-bottom: 8px; color: #8696a0; }

            .btn-toggle { border: none; width: 100%; padding: 6px; border-radius: 12px; font-weight: 800; font-size: 0.75rem; transition: 0.4s; }
            .btn-on { background: #25d366; color: white; box-shadow: 0 4px 12px rgba(37,211,102,0.3); }
            .btn-off { background: #3b4a54; color: #aebac1; }
            
            .stats-card { background: #2a3942; border-radius: 18px; padding: 12px; text-align: center; }
            .stats-v { color: #00a884; font-weight: 800; display: block; font-size: 1.1rem; }
            .stats-l { font-size: 0.6rem; color: #8696a0; text-transform: uppercase; }

            .log-box { 
                background: #000; color: #00ff41 !important; border-radius: 18px; 
                height: 180px; overflow-y: auto; padding: 15px; font-family: 'Consolas', monospace; 
                font-size: 0.75rem; border: 1px solid #333;
            }

            .footer-tag { font-size: 0.75rem; color: #8696a0; text-align: center; margin-top: 30px; border-top: 1px solid #2a3942; padding-top: 15px; }
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
                                <div class="mood-avatar">${randomMood}</div>
                                <h4 style="color:#00a884; margin:0; font-weight:800; letter-spacing:2px;">SYNECTIC <span style="color:#fff">CORE</span></h4>
                                <div class="badge bg-success mt-2">● ENGINE ACTIVE</div>
                            </div>

                            <div class="quote-container">
                                <div class="small text-success fw-bold mb-1">CORE VOICE SYSTEM</div>
                                <span class="quote-text" id="quoteText">"${randomQuote}"</span>
                            </div>

                            <div class="btn-action-area">
                                <div id="mainBtn" class="btn-neon-pill" onclick="toggleMenu()">
                                    <span>⚙️ SYSTEM CONFIG</span>
                                </div>
                            </div>

                            <div id="layoutMenu">
                                <div class="menu-card"><span>Quiz Bot</span><a href="/toggle/quiz"><button class="btn-toggle ${botConfig.quiz ? 'btn-on' : 'btn-off'}">${botConfig.quiz ? 'ACTIVE' : 'OFF'}</button></a></div>
                                <div class="menu-card"><span>Feedback</span><a href="/toggle/smartFeedback"><button class="btn-toggle ${botConfig.smartFeedback ? 'btn-on' : 'btn-off'}">${botConfig.smartFeedback ? 'ACTIVE' : 'OFF'}</button></a></div>
                                <div class="menu-card" style="grid-column: span 2;"><button class="btn btn-sm btn-dark w-100 mt-2" onclick="toggleMenu()">EXIT CONFIG</button></div>
                            </div>

                            <div class="row g-2 mt-3 text-center">
                                <div class="col-3"><div class="stats-card"><span class="stats-l">RAM</span><span class="stats-v">${usedRAM}G</span></div></div>
                                <div class="col-3"><div class="stats-card"><span class="stats-l">UP</span><span class="stats-v">${uptime}H</span></div></div>
                                <div class="col-3"><div class="stats-card"><span class="stats-l">CHAT</span><span class="stats-v">${stats.pesanMasuk}</span></div></div>
                                <div class="col-3"><div class="stats-card"><span class="stats-l">LOGS</span><span class="stats-v">${stats.totalLog}</span></div></div>
                            </div>

                            <div class="log-box mt-3" id="logBox">${logs.join('<br>')}</div>

                            <div class="footer-tag">CORE OPERATED BY ZAKI</div>
                        </div>
                    </div>
                    <script>
                        // Logic Suara Otomatis tanpa kontrol visual
                        function runVoice() {
                            const textToSpeak = document.getElementById('quoteText').innerText;
                            const utterance = new SpeechSynthesisUtterance("Sistem Synectic Core aktif. Pesan untuk hari ini. " + textToSpeak);
                            utterance.lang = 'id-ID';
                            utterance.volume = 1;
                            utterance.rate = 1.0;
                            window.speechSynthesis.speak(utterance);
                        }

                        // Mencoba jalan otomatis saat load
                        window.onload = runVoice;

                        function toggleMenu() {
                            const m = document.getElementById('layoutMenu');
                            const b = document.getElementById('mainBtn');
                            m.classList.toggle('show');
                            b.classList.toggle('active');
                            // Opsional: ngomong saat menu dibuka
                            if(m.classList.contains('show')) {
                                window.speechSynthesis.speak(new SpeechSynthesisUtterance("Membuka pengaturan sistem"));
                            }
                        }
                    </script>
                </body>
            </html>
        `;
    }
    return `<html><body>Loading...</body></html>`;
};

module.exports = { renderDashboard };                                                                                                                                 
