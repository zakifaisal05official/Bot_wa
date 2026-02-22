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
            
            /* --- LOGIN STYLES --- */
            #loginScreen {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: radial-gradient(circle, #121d23 0%, #0b141a 100%);
                z-index: 10000; display: flex; align-items: center; justify-content: center;
            }
            .login-box {
                background: #1f2c33; border: 1px solid #2a3942; border-radius: 40px;
                padding: 45px 35px; width: 90%; max-width: 420px; text-align: center;
                box-shadow: 0 30px 60px rgba(0,0,0,0.7); position: relative;
            }
            .login-avatar-area {
                width: 120px; height: 120px; margin: 0 auto 25px;
                position: relative; transition: 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            .login-profile-img { 
                width: 100%; height: 100%; border-radius: 50%; 
                border: 4px solid #00a884; object-fit: cover;
                box-shadow: 0 0 20px rgba(0, 168, 132, 0.4);
            }
            .login-emoji-state { 
                position: absolute; top: -10px; right: -10px; background: #1f2c33; 
                border-radius: 50%; width: 45px; height: 45px; display: flex; 
                align-items: center; justify-content: center; font-size: 24px; 
                border: 3px solid #00a884; box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            }

            .login-input {
                background: rgba(42, 57, 66, 0.5); border: 1px solid #3b4a54; color: white;
                border-radius: 18px; padding: 14px 20px; width: 100%; margin-bottom: 18px; 
                outline: none; transition: 0.3s; text-align: center;
            }
            .login-input:focus { border-color: #00a884; background: #2a3942; }

            .login-btn {
                background: #00a884; color: white; border: none; width: 100%;
                padding: 14px; border-radius: 18px; font-weight: 800; 
                text-transform: uppercase; letter-spacing: 2px;
                transition: 0.4s; box-shadow: 0 10px 20px rgba(0, 168, 132, 0.3);
                position: relative; overflow: hidden;
            }
            .login-btn:hover { background: #06cf9c; transform: translateY(-2px); box-shadow: 0 15px 25px rgba(0, 168, 132, 0.4); }
            .login-btn:active { transform: translateY(0); }
            .login-btn:disabled { background: #3b4a54; color: #8696a0; cursor: not-allowed; box-shadow: none; }

            #loginStatus { font-weight: 900; font-size: 1.1rem; margin-bottom: 20px; display: none; }
            .status-error { color: #ff5252; text-shadow: 0 0 10px rgba(255, 82, 82, 0.3); }
            .status-success { color: #25d366; text-shadow: 0 0 10px rgba(37, 211, 102, 0.3); }

            /* --- DASHBOARD STYLES --- */
            .card-custom { background: #1f2c33; border: 1px solid #2a3942; border-radius: 30px; box-shadow: 0 25px 50px rgba(0,0,0,0.8); position: relative; overflow: hidden; }
            @keyframes moodSwing {
                0% { transform: scale(1) rotate(0deg); }
                20% { transform: scale(1.1) rotate(-8deg); }
                40% { transform: translateX(-5px) rotate(0deg); }
                60% { transform: translateX(5px) rotate(0deg); }
                80% { transform: scale(1.1) rotate(8deg); }
                100% { transform: scale(1) rotate(0deg); }
            }
            .mood-avatar { 
                font-size: 55px; width: 100px; height: 100px; 
                background: rgba(0, 168, 132, 0.1); border: 3px solid #00a884; border-radius: 50%;
                display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;
                animation: moodSwing 5s infinite ease-in-out;
            }
            .quote-container { background: rgba(0, 168, 132, 0.08); border-left: 4px solid #00a884; padding: 15px; margin: 20px 0; border-radius: 15px; }
            .btn-neon-pill { background: rgba(0, 168, 132, 0.05); border: 2px solid #00a884; color: #00a884; padding: 8px 30px; border-radius: 50px; font-weight: 800; cursor: pointer; text-transform: uppercase; }
            .stats-card { background: #2a3942; border-radius: 18px; padding: 12px; text-align: center; }
            .log-box { background: #000; color: #00ff41 !important; border-radius: 18px; height: 180px; overflow-y: auto; padding: 15px; font-family: monospace; }
        </style>
    `;

    if (isConnected) {
        return `
            <html>
                <head><title>Synectic Core</title>${commonHead}</head>
                <body class="py-4">
                    <div id="loginScreen">
                        <div class="login-box animate__animated animate__zoomIn">
                            <div id="avatarArea" class="login-avatar-area">
                                <img src="${profilePic || 'https://via.placeholder.com/150'}" class="login-profile-img">
                                <div id="emojiState" class="login-emoji-state">😉</div>
                            </div>
                            <h3 id="loginTitle" style="color:#fff; font-weight:900; letter-spacing:3px; margin-bottom:20px;">ACCESS <span style="color:#00a884">CORE</span></h3>
                            
                            <div id="loginStatus" class="animate__animated"></div>

                            <div id="loginFields">
                                <input type="text" id="username" class="login-input" placeholder="USERNAME">
                                <input type="password" id="password" class="login-input" placeholder="PASSWORD">
                                <button id="submitBtn" onclick="attemptLogin()" class="login-btn">
                                    <span id="btnText">INITIALIZE SYSTEM</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div id="mainContent" class="container" style="max-width: 480px; display:none;">
                        <div class="card-custom p-4">
                            <div class="text-center mb-4">
                                <div class="mood-avatar">${randomMood}</div>
                                <h4 style="color:#00a884; margin:0; font-weight:800; letter-spacing:2px;">SYNECTIC <span style="color:#fff">CORE</span></h4>
                                <div class="badge bg-success mt-2">● ENGINE ACTIVE</div>
                            </div>
                            <div class="quote-container">
                                <span class="quote-text" id="quoteText" style="font-style:italic; font-size:0.85rem;">"${randomQuote}"</span>
                            </div>
                            <div class="text-center mb-4">
                                <div id="mainBtn" class="btn-neon-pill" onclick="toggleMenu()">⚙️ SYSTEM CONFIG</div>
                            </div>
                            <div id="layoutMenu" style="display:none;" class="row g-2 mb-3">
                                <div class="col-6"><div class="stats-card"><span>Quiz Bot</span><br><button class="btn btn-sm ${botConfig.quiz ? 'btn-success' : 'btn-secondary'} w-100 mt-1">${botConfig.quiz ? 'ON' : 'OFF'}</button></div></div>
                                <div class="col-6"><div class="stats-card"><span>Feedback</span><br><button class="btn btn-sm ${botConfig.smartFeedback ? 'btn-success' : 'btn-secondary'} w-100 mt-1">${botConfig.smartFeedback ? 'ON' : 'OFF'}</button></div></div>
                            </div>
                            <div class="row g-2 text-center mb-3">
                                <div class="col-3"><div class="stats-card"><small>RAM</small><br><b>${usedRAM}G</b></div></div>
                                <div class="col-3"><div class="stats-card"><small>UPTIME</small><br><b>${uptime}H</b></div></div>
                                <div class="col-3"><div class="stats-card"><small>CHAT</small><br><b>${stats.pesanMasuk}</b></div></div>
                                <div class="col-3"><div class="stats-card"><small>LOGS</small><br><b>${stats.totalLog}</b></div></div>
                            </div>
                            <div class="log-box" id="logBox">${logs.join('<br>')}</div>
                            <div class="text-center mt-4 small text-muted">CORE OPERATED BY <span class="text-success fw-bold">ZAKI</span></div>
                        </div>
                    </div>

                    <script>
                        let failedAttempts = 0;
                        let isCooldown = false;

                        function speak(msg) {
                            window.speechSynthesis.cancel();
                            const utterance = new SpeechSynthesisUtterance(msg);
                            utterance.lang = 'id-ID';
                            window.speechSynthesis.speak(utterance);
                        }

                        function attemptLogin() {
                            if(isCooldown) return;

                            const u = document.getElementById('username').value;
                            const p = document.getElementById('password').value;
                            const status = document.getElementById('loginStatus');
                            const fields = document.getElementById('loginFields');
                            const emoji = document.getElementById('emojiState');
                            const avatar = document.getElementById('avatarArea');
                            const box = document.querySelector('.login-box');

                            if(u === "Zaki" && p === "ZAKI_DEVELOPER_BOT") {
                                fields.style.display = "none";
                                document.getElementById('loginTitle').style.display = "none";
                                emoji.innerText = "😉";
                                avatar.style.transform = "scale(1.2)";
                                
                                status.innerHTML = "ACCESS GRANTED!<br><small>Welcome back, Zaki</small>";
                                status.className = "status-success animate__animated animate__pulse";
                                status.style.display = "block";
                                
                                speak("Akses diterima. Silakan masuk Zaki.");

                                setTimeout(() => {
                                    box.classList.add('animate__animated', 'animate__zoomOut');
                                    setTimeout(() => {
                                        document.getElementById('loginScreen').style.display = "none";
                                        const main = document.getElementById('mainContent');
                                        main.style.display = "block";
                                        main.classList.add('animate__animated', 'animate__fadeInUp');
                                        speak("Sistem Synectic Core aktif. " + document.getElementById('quoteText').innerText);
                                    }, 500);
                                }, 1800);
                            } else {
                                failedAttempts++;
                                emoji.innerText = "😡";
                                box.classList.add('animate__shakeX');
                                setTimeout(() => box.classList.remove('animate__shakeX'), 500);

                                if(failedAttempts >= 5) {
                                    startCooldown();
                                } else {
                                    status.innerHTML = "⚠️ KAMU BUKAN ZAKI!<br><small>("+failedAttempts+"/5 attempts)</small>";
                                    status.className = "status-error animate__animated animate__shakeX";
                                    status.style.display = "block";
                                    speak("Akses ditolak. Kamu bukan Zaki.");
                                }
                            }
                        }

                        function startCooldown() {
                            isCooldown = true;
                            let timeLeft = 20;
                            const status = document.getElementById('loginStatus');
                            const btn = document.getElementById('submitBtn');
                            const emoji = document.getElementById('emojiState');

                            btn.disabled = true;
                            emoji.innerText = "🤫";
                            speak("Sistem dikunci sementara selama 20 detik.");

                            const timer = setInterval(() => {
                                status.innerHTML = "CORE LOCKED!<br><small>Cooldown: " + timeLeft + "s</small>";
                                status.className = "status-error";
                                status.style.display = "block";
                                timeLeft--;

                                if(timeLeft < 0) {
                                    clearInterval(timer);
                                    isCooldown = false;
                                    failedAttempts = 0;
                                    btn.disabled = false;
                                    status.style.display = "none";
                                    emoji.innerText = "😕";
                                    speak("Sistem dibuka kembali. Silakan coba lagi.");
                                }
                            }, 1000);
                        }

                        function toggleMenu() {
                            const m = document.getElementById('layoutMenu');
                            m.style.display = m.style.display === 'none' ? 'flex' : 'none';
                        }
                    </script>
                </body>
            </html>
        `;
    }
    // QR & Initializing remains basic logic
    return `<html><head>${commonHead}</head><body class="vh-100 d-flex align-items-center justify-content-center"><div class="text-center"><div class="spinner-border text-success"></div><div class="mt-3">INITIALIZING CORE...</div></div></body></html>`;
};

module.exports = { renderDashboard };
                                             
