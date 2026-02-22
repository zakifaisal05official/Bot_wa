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
                background: #0b141a; z-index: 10000; display: flex; align-items: center; justify-content: center;
            }
            .login-box {
                background: #1f2c33; border: 1px solid #00a884; border-radius: 35px;
                padding: 40px; width: 90%; max-width: 400px; text-align: center;
                box-shadow: 0 20px 50px rgba(0,0,0,0.5); position: relative;
            }
            .login-profile-wrapper { position: relative; width: 100px; height: 100px; margin: 0 auto 20px; }
            .login-profile-img { width: 100%; height: 100%; border-radius: 50%; border: 3px solid #00a884; object-fit: cover; }
            .login-emoji-state { 
                position: absolute; bottom: 0; right: 0; background: #1f2c33; 
                border-radius: 50%; width: 35px; height: 35px; display: flex; 
                align-items: center; justify-content: center; font-size: 20px; border: 2px solid #00a884;
            }

            .login-input {
                background: #2a3942; border: 1px solid #3b4a54; color: white;
                border-radius: 15px; padding: 12px 20px; width: 100%; margin-bottom: 15px; outline: none;
            }
            .login-btn {
                background: #00a884; color: white; border: none; width: 100%;
                padding: 12px; border-radius: 15px; font-weight: 800; text-transform: uppercase; transition: 0.3s;
            }
            .login-btn:disabled { background: #3b4a54; color: #8696a0; cursor: not-allowed; }
            
            #loginStatus { font-weight: 900; font-size: 1rem; margin-bottom: 15px; display: none; }
            .status-error { color: #ff5252; }
            .status-success { color: #25d366; }

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
            .profile-section { text-align: center; margin-bottom: 20px; }
            .mood-avatar { 
                font-size: 55px; width: 100px; height: 100px; 
                background: rgba(0, 168, 132, 0.1); border: 3px solid #00a884; border-radius: 50%;
                display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;
                animation: moodSwing 5s infinite ease-in-out;
            }
            .quote-container { background: rgba(0, 168, 132, 0.08); border-left: 4px solid #00a884; padding: 15px; margin: 20px 0; border-radius: 15px; }
            .quote-text { font-style: italic; font-size: 0.85rem; color: #d1d7db; line-height: 1.5; }
            .btn-action-area { display: flex; justify-content: center; margin: 15px 0; }
            .btn-neon-pill { background: rgba(0, 168, 132, 0.05); border: 2px solid #00a884; color: #00a884; padding: 8px 30px; border-radius: 50px; font-weight: 800; font-size: 0.8rem; cursor: pointer; text-transform: uppercase; }
            #layoutMenu { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; max-height: 0; opacity: 0; overflow: hidden; transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
            #layoutMenu.show { max-height: 1000px; opacity: 1; margin-top: 20px; }
            .menu-card { background: #26353d; border: 1px solid #3b4a54; border-radius: 18px; padding: 12px; text-align: center; }
            .btn-toggle { border: none; width: 100%; padding: 6px; border-radius: 12px; font-weight: 800; font-size: 0.75rem; }
            .btn-on { background: #25d366; color: white; }
            .btn-off { background: #3b4a54; color: #aebac1; }
            .stats-card { background: #2a3942; border-radius: 18px; padding: 12px; text-align: center; }
            .log-box { background: #000; color: #00ff41 !important; border-radius: 18px; height: 180px; overflow-y: auto; padding: 15px; font-family: monospace; font-size: 0.75rem; }
        </style>
    `;

    if (isConnected) {
        return `
            <html>
                <head><title>Synectic Core</title>${commonHead}</head>
                <body class="py-4">
                    <div id="loginScreen">
                        <div class="login-box animate__animated animate__zoomIn">
                            <div class="login-profile-wrapper">
                                <img src="${profilePic || 'https://via.placeholder.com/100'}" class="login-profile-img">
                                <div id="emojiState" class="login-emoji-state">😕</div>
                            </div>
                            <h4 id="loginTitle" style="color:#00a884; font-weight:800;">SYNECTIC LOGIN</h4>
                            <div id="loginStatus"></div>
                            <div id="loginFields">
                                <input type="text" id="username" class="login-input" placeholder="User">
                                <input type="password" id="password" class="login-input" placeholder="Password">
                                <button id="submitBtn" onclick="attemptLogin()" class="login-btn">Initialize Core</button>
                            </div>
                        </div>
                    </div>

                    <div id="mainContent" class="container" style="max-width: 480px; display:none;">
                        <div class="card-custom p-4">
                            <div class="profile-section">
                                <div class="mood-avatar">${randomMood}</div>
                                <h4 style="color:#00a884; margin:0; font-weight:800;">SYNECTIC <span style="color:#fff">CORE</span></h4>
                                <div class="badge bg-success mt-2">● ENGINE ACTIVE</div>
                            </div>
                            <div class="quote-container">
                                <span class="quote-text" id="quoteText">"${randomQuote}"</span>
                            </div>
                            <div class="btn-action-area">
                                <div id="mainBtn" class="btn-neon-pill" onclick="toggleMenu()">⚙️ SYSTEM CONFIG</div>
                            </div>
                            <div id="layoutMenu">
                                <div class="menu-card"><span>Quiz</span><a href="/toggle/quiz"><button class="btn-toggle ${botConfig.quiz ? 'btn-on' : 'btn-off'}">${botConfig.quiz ? 'ON' : 'OFF'}</button></a></div>
                                <div class="menu-card"><span>Feedback</span><a href="/toggle/smartFeedback"><button class="btn-toggle ${botConfig.smartFeedback ? 'btn-on' : 'btn-off'}">${botConfig.smartFeedback ? 'ON' : 'OFF'}</button></a></div>
                            </div>
                            <div class="row g-2 mt-3 text-center">
                                <div class="col-3"><div class="stats-card"><span style="font-size:0.6rem">RAM</span><br>${usedRAM}G</div></div>
                                <div class="col-3"><div class="stats-card"><span style="font-size:0.6rem">UPTIME</span><br>${uptime}H</div></div>
                                <div class="col-3"><div class="stats-card"><span style="font-size:0.6rem">CHAT</span><br>${stats.pesanMasuk}</div></div>
                                <div class="col-3"><div class="stats-card"><span style="font-size:0.6rem">LOGS</span><br>${stats.totalLog}</div></div>
                            </div>
                            <div class="log-box mt-3" id="logBox">${logs.join('<br>')}</div>
                            <div class="footer-tag mt-3 text-center small text-muted">CORE OPERATED BY ZAKI</div>
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
                            const btn = document.getElementById('submitBtn');
                            const box = document.querySelector('.login-box');

                            if(u === "Zaki" && p === "ZAKI_DEVELOPER_BOT") {
                                fields.style.display = "none";
                                document.getElementById('loginTitle').style.display = "none";
                                emoji.innerText = "😉";
                                status.innerHTML = "LOGIN SUKSES! <br> MENGHUBUNGKAN KE INTI...";
                                status.className = "status-success";
                                status.style.display = "block";
                                
                                speak("Login sukses. Silakan masuk Zaki.");

                                setTimeout(() => {
                                    box.classList.add('animate__animated', 'animate__zoomOut');
                                    setTimeout(() => {
                                        document.getElementById('loginScreen').style.display = "none";
                                        const main = document.getElementById('mainContent');
                                        main.style.display = "block";
                                        main.classList.add('animate__animated', 'animate__fadeInUp');
                                        speak("Sistem Synectic Core aktif. " + document.getElementById('quoteText').innerText);
                                    }, 500);
                                }, 1500);
                            } else {
                                failedAttempts++;
                                emoji.innerText = "😡";
                                box.classList.add('animate__shakeX');
                                setTimeout(() => box.classList.remove('animate__shakeX'), 500);

                                if(failedAttempts >= 5) {
                                    startCooldown();
                                } else {
                                    status.innerHTML = "⚠️ KAMU BUKAN ZAKI! ("+failedAttempts+"/5)";
                                    status.className = "status-error";
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
                            speak("Terlalu banyak percobaan. Sistem dikunci 20 detik.");

                            const timer = setInterval(() => {
                                status.innerHTML = "CORE TERKUNCI! <br> TUNGGU " + timeLeft + " DETIK";
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
                                    speak("Sistem dibuka kembali.");
                                }
                            }, 1000);
                        }

                        function toggleMenu() {
                            document.getElementById('layoutMenu').classList.toggle('show');
                        }
                    </script>
                </body>
            </html>
        `;
    }

    if (qrCodeData) {
        return `<html><head>${commonHead}</head><body class="vh-100 d-flex align-items-center justify-content-center"><div class="card-custom p-5 text-center"><h5>SCAN WHATSAPP</h5><img src="${qrCodeData}" class="img-fluid"></div></body></html>`;
    }

    return `<html><head>${commonHead}</head><body class="vh-100 d-flex align-items-center justify-content-center"><div class="text-center"><div class="spinner-border text-success"></div><div class="mt-2">INITIALIZING...</div></div></body></html>`;
};

module.exports = { renderDashboard };
