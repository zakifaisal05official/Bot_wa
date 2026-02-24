const os = require("os");

const renderDashboard = (isConnected, qrCodeData, botConfig, stats, logs, port) => {
    const usedRAM = ((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(2);
    const uptime = (os.uptime() / 3600).toFixed(1);
    const moodEmojis = ["🚀", "🤖", "🔥", "✨", "✅"];
    const randomMood = moodEmojis[Math.floor(Math.random() * moodEmojis.length)];

    return `
        <html>
            <head>
                <title>Y.B.M ASISTEN</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                <style>
                    body { background: #0b141a; color: #e9edef; font-family: 'Segoe UI', sans-serif; overflow-x: hidden; }
                    .card-custom { background: #1f2c33; border: 1px solid #2a3942; border-radius: 30px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                    .qr-container { background: white; padding: 15px; border-radius: 20px; display: inline-block; margin: 15px 0; border: 5px solid #00a884; }
                    .log-box { background: #000; color: #00ff41 !important; border-radius: 18px; height: 180px; overflow-y: auto; padding: 15px; font-family: monospace; font-size: 0.75rem; text-align: left; }
                    .stats-card { background: #2a3942; border-radius: 18px; padding: 10px; margin-bottom: 5px; text-align: center; border: 1px solid transparent; transition: 0.3s; }
                    .stats-card:hover { border-color: #00a884; }
                    .grid-menu { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px; }
                    .btn-toggle { border: none; width: 100%; padding: 8px; border-radius: 10px; font-weight: bold; }
                    .btn-on { background: #25d366; color: white; box-shadow: 0 0 10px rgba(37, 211, 102, 0.4); }
                    .btn-off { background: #3b4a54; color: #aebac1; }
                    
                    /* CSS Anti-Tabrak */
                    #blocker { 
                        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                        background: #0b141a; z-index: 10000; display: none; 
                        align-items: center; justify-content: center; text-align: center; 
                    }
                </style>
            </head>
            <body>
                <div id="blocker">
                    <div class="p-4 animate__animated animate__fadeIn">
                        <i class="fas fa-shield-halved text-success mb-3" style="font-size: 60px;"></i>
                        <h2 class="fw-bold">SESI AKTIF DI TAB LAIN</h2>
                        <p class="text-muted">Gunakan tombol di bawah untuk mengambil alih kendali.</p>
                        <button class="btn btn-success btn-lg px-5" onclick="takeControl()" style="border-radius:50px;">AMBIL ALIH KENDALI</button>
                    </div>
                </div>

                <div class="container py-4" style="max-width: 500px;">
                    <div class="card-custom text-center">
                        <div style="font-size: 50px;">${randomMood}</div>
                        <h3 style="color:#00a884; font-weight:900; letter-spacing:2px; margin-bottom:0;">Y.B.M <span style="color:#fff">ASISTEN</span></h3>
                        
                        <div id="notifSuara" class="small mb-3" style="color: #00ff73; font-weight: bold; height: 20px;"></div>

                        <div class="mb-3">
                            <span class="badge ${isConnected ? 'bg-success' : 'bg-danger'} animate__animated animate__pulse animate__infinite">
                                ● ${isConnected ? 'BOT CONNECTED' : 'BOT DISCONNECTED'}
                            </span>
                        </div>

                        ${!isConnected ? `
                            <div class="qr-area">
                                <div class="qr-container">
                                    ${qrCodeData ? `<img src="${qrCodeData}" width="220">` : `<div class="p-5 text-dark"><i class="fas fa-spinner fa-spin"></i> Loading QR...</div>`}
                                </div>
                                <button class="btn btn-outline-light btn-sm w-100 mb-3" onclick="location.reload()" style="border-radius:50px;">🔄 REFRESH QR</button>
                            </div>
                        ` : ''}

                        <div class="grid-menu">
                            <div class="stats-card"><small>Kuis</small><br><a href="/toggle/quiz"><button class="btn-toggle ${botConfig.quiz ? 'btn-on' : 'btn-off'}">${botConfig.quiz ? 'ON' : 'OFF'}</button></a></div>
                            <div class="stats-card"><small>Jadwal</small><br><a href="/toggle/jadwalBesok"><button class="btn-toggle ${botConfig.jadwalBesok ? 'btn-on' : 'btn-off'}">${botConfig.jadwalBesok ? 'ON' : 'OFF'}</button></a></div>
                            <div class="stats-card"><small>Feedback</small><br><a href="/toggle/smartFeedback"><button class="btn-toggle ${botConfig.smartFeedback ? 'btn-on' : 'btn-off'}">${botConfig.smartFeedback ? 'ON' : 'OFF'}</button></a></div>
                            <div class="stats-card"><small>PR Mingguan</small><br><a href="/toggle/prMingguan"><button class="btn-toggle ${botConfig.prMingguan ? 'btn-on' : 'btn-off'}">${botConfig.prMingguan ? 'ON' : 'OFF'}</button></a></div>
                            <div class="stats-card" style="grid-column: span 2;"><small>Sahur (04:00 WIB)</small><br><a href="/toggle/sahur"><button class="btn-toggle ${botConfig.sahur ? 'btn-on' : 'btn-off'}">${botConfig.sahur ? 'ON' : 'OFF'}</button></a></div>
                        </div>

                        <div class="row g-2 mt-2">
                            <div class="col-6"><div class="stats-card"><small>RAM</small><br><b>${usedRAM}GB</b></div></div>
                            <div class="col-6"><div class="stats-card"><small>UPTIME</small><br><b>${uptime}H</b></div></div>
                        </div>

                        <div class="log-box mt-3">${logs.join('<br>')}</div>
                        <div class="mt-4 small text-muted">SYSTEM BY <span class="text-success fw-bold">RIDFOT</span></div>
                    </div>
                </div>

                <script>
                    const S_KEY = 'ybm_master_tab';
                    const myId = Math.random().toString();

                    function sync() {
                        const master = localStorage.getItem(S_KEY);
                        if (master && master !== myId) {
                            document.getElementById('blocker').style.display = 'flex';
                        } else {
                            localStorage.setItem(S_KEY, myId);
                            document.getElementById('blocker').style.display = 'none';
                        }
                    }

                    function takeControl() {
                        localStorage.setItem(S_KEY, myId);
                        location.reload();
                    }

                    function speak(txt) {
                        const u = new SpeechSynthesisUtterance(txt);
                        u.lang = 'id-ID';
                        u.rate = 1.0;
                        window.speechSynthesis.speak(u);
                    }

                    window.onload = () => {
                        sync();
                        setInterval(sync, 2000); // Cek tiap 2 detik

                        const status = ${isConnected};
                        const msg = status ? "Bot Ridfot sudah aktif dan siap digunakan." : "Perhatian, bot terputus. Silakan lakukan scan Q R.";
                        
                        document.getElementById('notifSuara').innerText = status ? "✨ Bot Online & Ready" : "⚠️ Segera Scan QR";
                        
                        // Bicara saat user interaksi pertama kali
                        document.body.addEventListener('click', () => {
                            if(!window.spoken) {
                                speak(msg);
                                window.spoken = true;
                            }
                        }, {once: true});
                    };

                    window.onbeforeunload = () => {
                        if(localStorage.getItem(S_KEY) === myId) {
                            localStorage.removeItem(S_KEY);
                        }
                    };
                </script>
            </body>
        </html>
    `;
};

module.exports = { renderDashboard };
