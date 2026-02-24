const os = require("os");

const renderDashboard = (isConnected, qrCodeData, botConfig, stats, logs, port) => {
    const usedRAM = ((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(2);
    const uptime = (os.uptime() / 3600).toFixed(1);

    const moodEmojis = ["😅", "🤣", "😁", "😕", "🤫", "😆", "😗", "😂"];
    const randomMood = moodEmojis[Math.floor(Math.random() * moodEmojis.length)];

    const quotes = [
        "Tetap fokus, hasil tidak akan mengkhianati proses!",
        "Coding adalah seni, dan kamu adalah senimannya.",
        "Error adalah cara kode mengatakan: 'Ajari aku lebih baik'.",
        "Jadikan hari ini lebih baik dari kemarin!",
        "Bekerja keraslah dalam diam, biarkan botmu yang berisik!"
    ];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

    const commonHead = `
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            body { background: #0b141a; color: #e9edef; font-family: 'Segoe UI', sans-serif; overflow-x: hidden; }
            #loginScreen {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: radial-gradient(circle, #121d23 0%, #0b141a 100%);
                z-index: 10000; display: flex; align-items: center; justify-content: center;
            }
            .login-box {
                background: #1f2c33; border: 1px solid #2a3942; border-radius: 40px;
                padding: 45px 35px; width: 90%; max-width: 420px; text-align: center;
                box-shadow: 0 30px 60px rgba(0,0,0,0.7);
            }
            .login-avatar-area {
                width: 120px; height: 120px; margin: 0 auto 25px;
                display: flex; align-items: center; justify-content: center;
                background: rgba(0, 168, 132, 0.1); border: 4px solid #00a884; border-radius: 50%;
                font-size: 65px; animation: moodSwing 5s infinite ease-in-out;
            }
            .login-input {
                background: rgba(42, 57, 66, 0.5); border: 1px solid #3b4a54; color: white;
                border-radius: 18px; padding: 14px 20px; width: 100%; margin-bottom: 18px; outline: none; text-align: center;
            }
            .login-btn {
                background: #00a884; color: white; border: none; width: 100%;
                padding: 14px; border-radius: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;
            }
            .qr-container { background: white; padding: 20px; border-radius: 20px; display: inline-block; margin-top: 20px; }
            .card-custom { background: #1f2c33; border: 1px solid #2a3942; border-radius: 30px; padding: 25px; }
            .status-error { color: #ff5252; font-weight: bold; margin-bottom: 15px; }
            @keyframes moodSwing {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            /* Style Log Box */
            .log-box { background: #000; color: #00ff41 !important; border-radius: 18px; height: 180px; overflow-y: auto; padding: 15px; font-family: monospace; font-size: 0.75rem; text-align: left; }
            .stats-card { background: #2a3942; border-radius: 18px; padding: 10px; margin-bottom: 5px; }
            #layoutMenu { display: none; margin-top: 20px; }
            #layoutMenu.show { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .btn-toggle { border: none; width: 100%; padding: 8px; border-radius: 10px; font-weight: bold; }
            .btn-on { background: #25d366; color: white; }
            .btn-off { background: #3b4a54; color: #aebac1; }
        </style>
    `;

    return `
        <html>
            <head><title>Y.B.M ASISTEN</title>${commonHead}</head>
            <body>
                <div id="loginScreen">
                    <div class="login-box animate__animated animate__zoomIn">
                        <div id="avatarArea" class="login-avatar-area">${randomMood}</div>
                        <h3 style="color:#fff; font-weight:900; letter-spacing:3px; margin-bottom:20px;">Y.B.M <span style="color:#00a884">ASISTEN</span></h3>
                        <div id="loginStatus" style="display:none;"></div>
                        <div id="loginFields">
                            <input type="text" id="username" class="login-input" placeholder="USERNAME">
                            <input type="password" id="password" class="login-input" placeholder="PASSWORD">
                            <button onclick="attemptLogin()" class="login-btn">LOGIN</button>
                        </div>
                    </div>
                </div>

                <div id="mainContent" class="container" style="max-width: 480px; display:none; padding-top: 50px;">
                    <div class="card-custom text-center">
                        ${isConnected ? `
                            <div class="mood-avatar" style="font-size: 50px;">${randomMood}</div>
                            <h4 style="color:#00a884; font-weight:800;">Y.B.M <span style="color:#fff">ASISTEN</span></h4>
                            <div class="badge bg-success mb-3">● ENGINE ACTIVE</div>
                            
                            <div style="background: rgba(0, 168, 132, 0.08); padding: 15px; border-radius: 15px; margin-bottom: 20px;">
                                <small id="quoteText">"${randomQuote}"</small>
                            </div>

                            <button class="btn btn-outline-success w-100 mb-3" style="border-radius: 50px; font-weight: 800;" onclick="toggleMenu()">⚙️ SYSTEM CONFIG</button>

                            <div id="layoutMenu">
                                <div class="stats-card"><small>Quiz</small><br><a href="/toggle/quiz"><button class="btn-toggle ${botConfig.quiz ? 'btn-on' : 'btn-off'}">${botConfig.quiz ? 'ON' : 'OFF'}</button></a></div>
                                <div class="stats-card"><small>Jadwal</small><br><a href="/toggle/jadwalBesok"><button class="btn-toggle ${botConfig.jadwalBesok ? 'btn-on' : 'btn-off'}">${botConfig.jadwalBesok ? 'ON' : 'OFF'}</button></a></div>
                            </div>

                            <div class="row g-2 mt-2">
                                <div class="col-6"><div class="stats-card"><small>RAM</small><br><b>${usedRAM}GB</b></div></div>
                                <div class="col-6"><div class="stats-card"><small>UPTIME</small><br><b>${uptime}H</b></div></div>
                            </div>
                            <div class="log-box mt-3">${logs.join('<br>')}</div>
                        ` : `
                            <h4 style="color:#fff; font-weight:800;">SCAN WHATSAPP QR</h4>
                            <p class="small text-muted">Silakan scan untuk menyambungkan bot</p>
                            <div class="qr-container">
                                ${qrCodeData ? `<img src="${qrCodeData}" width="250">` : `<div class="spinner-border text-success"></div><p>Menunggu QR...</p>`}
                            </div>
                            <div class="mt-3">
                                <button class="btn btn-sm btn-dark" onclick="window.location.reload()">🔄 REFRESH QR</button>
                            </div>
                        `}
                        <div class="mt-4 small text-muted">CORE BY <span class="text-success fw-bold">ZAKI</span></div>
                    </div>
                </div>

                <script>
                    function attemptLogin() {
                        const u = document.getElementById('username').value;
                        const p = document.getElementById('password').value;
                        const status = document.getElementById('loginStatus');
                        
                        if(u === "ZAKI" && p === "ZAKI_DEVELOPER_BOT") {
                            document.getElementById('loginScreen').style.display = "none";
                            document.getElementById('mainContent').style.display = "block";
                        } else {
                            status.innerHTML = "⚠️ AKSES DITOLAK!";
                            status.className = "status-error animate__animated animate__shakeX";
                            status.style.display = "block";
                        }
                    }
                    function toggleMenu() {
                        const m = document.getElementById('layoutMenu');
                        m.classList.toggle('show');
                    }
                </script>
            </body>
        </html>
    `;
};

module.exports = { renderDashboard };
