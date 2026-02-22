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
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
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
                display: flex; align-items: center; justify-content: center;
                background: rgba(0, 168, 132, 0.1); border: 4px solid #00a884; border-radius: 50%;
                font-size: 65px; animation: moodSwing 5s infinite ease-in-out;
            }

            .input-container { position: relative; width: 100%; }
            .login-input {
                background: rgba(42, 57, 66, 0.5); border: 1px solid #3b4a54; color: white;
                border-radius: 18px; padding: 14px 20px; width: 100%; margin-bottom: 18px; 
                outline: none; transition: 0.3s; text-align: center;
            }
            .toggle-eye { position: absolute; right: 20px; top: 18px; color: #8696a0; cursor: pointer; }

            .login-btn {
                background: #00a884; color: white; border: none; width: 100%;
                padding: 14px; border-radius: 18px; font-weight: 800; 
                text-transform: uppercase; letter-spacing: 2px; transition: 0.4s;
            }

            @keyframes moodSwing {
                0% { transform: scale(1) rotate(0deg); }
                20% { transform: scale(1.1) rotate(-8deg); }
                40% { transform: translateX(-5px) rotate(0deg); }
                60% { transform: translateX(5px) rotate(0deg); }
                80% { transform: scale(1.1) rotate(8deg); }
                100% { transform: scale(1) rotate(0deg); }
            }

            /* --- DASHBOARD STYLES --- */
            .card-custom { background: #1f2c33; border: 1px solid #2a3942; border-radius: 30px; box-shadow: 0 25px 50px rgba(0,0,0,0.8); position: relative; overflow: hidden; }
            .mood-avatar { 
                font-size: 55px; width: 100px; height: 100px; 
                background: rgba(0, 168, 132, 0.1); border: 3px solid #00a884; border-radius: 50%;
                display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;
                animation: moodSwing 5s infinite ease-in-out;
            }
            .quote-container { background: rgba(0, 168, 132, 0.08); border-left: 4px solid #00a884; padding: 15px; margin: 20px 0; border-radius: 15px; }
            .btn-neon-pill { background: rgba(0, 168, 132, 0.05); border: 2px solid #00a884; color: #00a884; padding: 8px 30px; border-radius: 50px; font-weight: 800; cursor: pointer; text-transform: uppercase; }
            
            #layoutMenu { 
                display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
                max-height: 0; opacity: 0; overflow: hidden;
                transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            }
            #layoutMenu.show { max-height: 1000px; opacity: 1; margin-top: 20px; padding: 5px; }

            .menu-card { background: #26353d; border: 1px solid #3b4a54; border-radius: 18px; padding: 12px; text-align: center; }
            .menu-card span { font-size: 0.65rem; font-weight: 800; display: block; margin-bottom: 8px; color: #8696a0; }
            .btn-toggle { border: none; width: 100%; padding: 6px; border-radius: 12px; font-weight: 800; font-size: 0.75rem; transition: 0.3s; }
            .btn-on { background: #25d366; color: white; }
            .btn-off { background: #3b4a54; color: #aebac1; }
            
            .stats-card { background: #2a3942; border-radius: 18px; padding: 12px; text-align: center; }
            .log-box { background: #000; color: #00ff41 !important; border-radius: 18px; height: 180px; overflow-y: auto; padding: 15px; font-family: monospace; font-size: 0.75rem; }
        </style>
    `;

    if (isConnected) {
        return `
            <html>
                <head><title>Y.B.M ASISTEN</title>${commonHead}</head>
                <body class="py-4">
                    <div id="loginScreen">
                        <div class="login-box animate__animated animate__zoomIn">
                            <div id="avatarArea" class="login-avatar-area">${randomMood}</div>
                            <h3 id="loginTitle" style="color:#fff; font-weight:900; letter-spacing:3px; margin-bottom:20px;">Y.B.M <span style="color:#00a884">ASISTEN</span></h3>
                            <div id="loginStatus" class="animate__animated"></div>
                            <div id="loginFields">
                                <input type="text" id="username" class="login-input" placeholder="USERNAME">
                                <div class="input-container">
                                    <input type="password" id="password" class="login-input" placeholder="PASSWORD">
                                    <i class="fa-solid fa-eye-slash toggle-eye" onclick="togglePass()"></i>
                                </div>
                                <button id="submitBtn" onclick="attemptLogin()" class="login-btn">LOGIN</button>
                            </div>
                            <div id="loginLoading" style="display:none;" class="mt-3">
                                <div class="spinner-border text-success"></div>
                                <div class="mt-2 text-success fw-bold">AUTHENTICATING...</div>
                            </div>
                        </div>
                    </div>

                    <div id="mainContent" class="container" style="max-width: 480px; display:none;">
                        <div class="card-custom p-4">
                            <div class="text-center mb-4">
                                <div class="mood-avatar">${randomMood}</div>
                                <h4 style="color:#00a884; margin:0; font-weight:800; letter-spacing:2px;">Y.B.M <span style="color:#fff">ASISTEN</span></h4>
                                <div class="badge bg-success mt-2">● ENGINE ACTIVE</div>
                            </div>
                            <div class="quote-container">
                                <span class="quote-text" id="quoteText" style="font-style:italic; font-size:0.85rem;">"${randomQuote}"</span>
                            </div>
                            <div class="text-center mb-4">
                                <div id="mainBtn" class="btn-neon-pill" onclick="toggleMenu()">⚙️ SYSTEM CONFIG</div>
                            </div>

                            <div id="layoutMenu">
                                <div class="menu-card"><span>Quiz Bot</span><a href="/toggle/quiz"><button class="btn-toggle ${botConfig.quiz ? 'btn-on' : 'btn-off'}">${botConfig.quiz ? 'ACTIVE' : 'OFF'}</button></a></div>
                                <div class="menu-card"><span>Feedback</span><a href="/toggle/smartFeedback"><button class="btn-toggle ${botConfig.smartFeedback ? 'btn-on' : 'btn-off'}">${botConfig.smartFeedback ? 'ACTIVE' : 'OFF'}</button></a></div>
                                <div class="menu-card"><span>Jadwal</span><a href="/toggle/jadwalBesok"><button class="btn-toggle ${botConfig.jadwalBesok ? 'btn-on' : 'btn-off'}">${botConfig.jadwalBesok ? 'ACTIVE' : 'OFF'}</button></a></div>
                                <div class="menu-card"><span>PR Info</span><a href="/toggle/prMingguan"><button class="btn-toggle ${botConfig.prMingguan ? 'btn-on' : 'btn-off'}">${botConfig.prMingguan ? 'ACTIVE' : 'OFF'}</button></a></div>
                                <div class="menu-card" style="grid-column: span 2;"><span>Sahur Reminder</span><a href="/toggle/sahur"><button class="btn-toggle ${botConfig.sahur ? 'btn-on' : 'btn-off'}">${botConfig.sahur ? 'ACTIVE' : 'OFF'}</button></a></div>
                            </div>

                            <div class="row g-2 text-center mt-3">
                                <div class="col-3"><div class="stats-card"><small>RAM</small><br><b>${usedRAM}G</b></div></div>
                                <div class="col-3"><div class="stats-card"><small>UPTIME</small><br><b>${uptime}H</b></div></div>
                                <div class="col-3"><div class="stats-card"><small>CHAT</small><br><b>${stats.pesanMasuk}</b></div></div>
                                <div class="col-3"><div class="stats-card"><small>LOGS</small><br><b>${stats.totalLog}</b></div></div>
                            </div>
                            <div class="log-box mt-3" id="logBox">${logs.join('<br>')}</div>
                            <div class="text-center mt-4 small text-muted">CORE OPERATED BY <span class="text-success fw-bold">ZAKI</span></div>
                        </div>
                    </div>

                    <script>
                        let failedAttempts = 0;
                        let isCooldown = false;

                        function togglePass() {
                            const p = document.getElementById('password');
                            const icon = event.target;
                            if(p.type === "password") { p.type = "text"; icon.classList.replace('fa-eye-slash', 'fa-eye'); }
                            else { p.type = "password"; icon.classList.replace('fa-eye', 'fa-eye-slash'); }
                        }

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
                            const loader = document.getElementById('loginLoading');
                            const avatar = document.getElementById('avatarArea');
                            const box = document.querySelector('.login-box');

                            if(u === "ZAKI" && p === "ZAKI_DEVELOPER_BOT") {
                                fields.style.display = "none";
                                loader.style.display = "block";
                                avatar.innerText = "😉";
                                speak("Login sukses. Silakan masuk Zaki.");
                                setTimeout(() => {
                                    status.innerHTML = "ACCESS GRANTED!";
                                    status.className = "status-success animate__animated animate__pulse";
                                    status.style.display = "block";
                                    setTimeout(() => {
                                        box.classList.add('animate__animated', 'animate__zoomOut');
                                        setTimeout(() => {
                                            document.getElementById('loginScreen').style.display = "none";
                                            const main = document.getElementById('mainContent');
                                            main.style.display = "block";
                                            main.classList.add('animate__animated', 'animate__fadeInUp');
                                            speak("Sistem Y.B.M ASISTEN aktif. " + document.getElementById('quoteText').innerText);
                                        }, 500);
                                    }, 1000);
                                }, 1500);
                            } else {
                                failedAttempts++;
                                avatar.innerText = "😡";
                                box.classList.add('animate__shakeX');
                                setTimeout(() => {
                                    box.classList.remove('animate__shakeX');
                                    if(!isCooldown) avatar.innerText = "${randomMood}";
                                }, 500);
                                if(failedAttempts >= 5) startCooldown();
                                else {
                                    status.innerHTML = "⚠️ PASSWORD SALAH! ("+failedAttempts+"/5)";
                                    status.className = "status-error";
                                    status.style.display = "block";
                                }
                            }
                        }

                        function startCooldown() {
                            isCooldown = true;
                            let timeLeft = 20;
                            const status = document.getElementById('loginStatus');
                            const btn = document.getElementById('submitBtn');
                            const avatar = document.getElementById('avatarArea');
                            btn.disabled = true;
                            avatar.innerText = "🤫";
                            const timer = setInterval(() => {
                                status.innerHTML = "CORE LOCKED! (" + timeLeft + "s)";
                                status.className = "status-error";
                                status.style.display = "block";
                                timeLeft--;
                                if(timeLeft < 0) {
                                    clearInterval(timer);
                                    isCooldown = false;
                                    failedAttempts = 0;
                                    btn.disabled = false;
                                    status.style.display = "none";
                                    avatar.innerText = "${randomMood}";
                                }
                            }, 1000);
                        }

                        function toggleMenu() {
                            const m = document.getElementById('layoutMenu');
                            m.classList.toggle('show');
                        }
                    </script>
                </body>
            </html>
        `;
    }
    return `<html><head>${commonHead}</head><body class="vh-100 d-flex align-items-center justify-content-center"><div class="text-center"><div class="spinner-border text-success"></div><div class="mt-3">INITIALIZING...</div></div></body></html>`;
};

module.exports = { renderDashboard };
                                    
