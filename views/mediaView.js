// views/mediaView.js

const renderMediaView = (fileUrls) => {
    const urls = Array.isArray(fileUrls) ? fileUrls : [fileUrls];
    const isPdf = urls[0].toLowerCase().endsWith('.pdf');
    
    // 20 Kata-kata semangat untuk ditampilkan secara acak
    const quotes = [
        "Semangat! Setiap langkah kecil membawamu ke tujuan besar.",
        "Jangan menyerah, hal-hal besar butuh waktu.",
        "Kamu melakukan pekerjaan yang luar biasa!",
        "Fokus pada proses, hasil akan mengikuti.",
        "Jadikan hari ini lebih baik dari kemarin.",
        "Disiplin adalah kunci kesuksesan.",
        "Percaya pada dirimu sendiri seperti Y.M.B percaya padamu.",
        "Tugas ini adalah investasi untuk masa depanmu.",
        "Istirahatlah jika lelah, tapi jangan berhenti.",
        "Kesalahan adalah bukti bahwa kamu sedang mencoba.",
        "Satu persen lebih baik setiap hari!",
        "Tetap tenang dan selesaikan tugasmu.",
        "Masa depan cerah menantimu di depan sana.",
        "Jangan bandingkan prosesmu dengan orang lain.",
        "Kamu lebih kuat dari tantangan yang kamu hadapi.",
        "Kerja keras hari ini, senyum manis hari esok.",
        "Bikin dirimu bangga hari ini!",
        "Tidak ada kata terlambat untuk mulai belajar.",
        "Keberhasilan dimulai dari keputusan untuk mencoba.",
        "Y.M.B ASISTEN selalu mendukung setiap progresmu!"
    ];

    return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
        <title>Y.M.B ASISTEN - Media View</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
        <style>
            :root { --primary: #00a884; --bg: #0b141a; --card: #1f2c33; }
            body { background: var(--bg); color: #e9edef; font-family: 'Segoe UI', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; overflow-x: hidden; cursor: pointer; }
            
            .card-custom { background: var(--card); border: 1px solid #2a3942; border-radius: 30px; box-shadow: 0 25px 50px rgba(0,0,0,0.8); width: 100%; max-width: 800px; overflow: hidden; position: relative; pointer-events: auto; }
            
            .media-header { padding: 20px; text-align: center; border-bottom: 1px solid #2a3942; background: rgba(0,0,0,0.2); }
            .media-header h5 { color: var(--primary); font-weight: 800; letter-spacing: 2px; margin: 0; text-transform: uppercase; }
            
            .media-content { padding: 20px; text-align: center; }
            .media-frame { border-radius: 15px; border: 2px solid var(--primary); box-shadow: 0 0 20px rgba(0,168,132,0.2); max-width: 100%; height: auto; max-height: 60vh; object-fit: contain; cursor: zoom-in; transition: 0.3s; }
            
            /* Support Zoom & Pan in Fullscreen */
            .media-frame:fullscreen { object-fit: contain; background: black; width: 100vw; height: 100vh; cursor: move; }

            .quote-container { margin: 15px 0; padding: 15px; background: rgba(0,168,132,0.1); border-radius: 15px; border-left: 4px solid var(--primary); }
            .quote-text { font-style: italic; font-size: 0.9rem; color: #d1d7db; }

            .swiper { width: 100%; padding-bottom: 40px; }
            .swiper-button-next, .swiper-button-prev { color: var(--primary) !important; transform: scale(0.7); }
            .swiper-pagination-bullet-active { background: var(--primary) !important; }

            .btn-group-custom { display: flex; flex-direction: column; gap: 10px; align-items: center; margin-top: 15px; }
            
            .btn-download { 
                background: linear-gradient(135deg, var(--primary), #06cf9c); color: white; border: none; padding: 14px 35px; border-radius: 50px; 
                font-weight: 800; text-decoration: none; display: inline-flex; align-items: center; gap: 10px;
                transition: 0.4s; box-shadow: 0 8px 20px rgba(0,168,132,0.3); animation: pulseCustom 2s infinite;
            }
            .btn-download:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 12px 25px rgba(0,168,132,0.5); color: white; }
            
            .btn-fullscreen { background: transparent; color: var(--primary); border: 1px solid var(--primary); padding: 8px 20px; border-radius: 50px; font-size: 0.8rem; font-weight: 600; transition: 0.3s; }
            .btn-fullscreen:hover { background: var(--primary); color: white; }

            @keyframes pulseCustom { 0% { box-shadow: 0 0 0 0 rgba(0,168,132,0.4); } 70% { box-shadow: 0 0 0 15px rgba(0,168,132,0); } 100% { box-shadow: 0 0 0 0 rgba(0,168,132,0); } }

            .footer-tag { font-size: 0.75rem; color: #8696a0; text-align: center; padding: 15px; border-top: 1px solid #2a3942; letter-spacing: 1px; }
            .zaki-name { color: var(--primary); font-weight: bold; }

            @media (min-width: 992px) { .card-custom { max-width: 900px; } .media-frame { max-height: 70vh; } }
        </style>
    </head>
    <body onclick="playQuoteVoice()">
        <div class="card-custom animate__animated animate__zoomIn" onclick="event.stopPropagation(); playQuoteVoice();">
            <div class="media-header">
                <h5>📁 ${isPdf ? 'LAMPIRAN DOKUMEN' : 'GALERI TUGAS'}</h5>
            </div>
            
            <div class="media-content">
                <div class="quote-container animate__animated animate__fadeIn">
                    <div class="quote-text" id="randomQuote"></div>
                    <div style="font-size: 0.6rem; color: var(--primary); margin-top: 5px; opacity: 0.7;">🔊 Klik layar untuk suara & Full screen untuk zoom</div>
                </div>

                ${isPdf ? 
                    `<iframe src="${urls[0]}" width="100%" height="500px" class="media-frame"></iframe>` :
                    `<div class="swiper">
                        <div class="swiper-wrapper">
                            ${urls.map(url => `
                                <div class="swiper-slide">
                                    <img src="${url}" class="media-frame img-fluid" alt="Tugas" onclick="toggleFullScreen(this)">
                                </div>
                            `).join('')}
                        </div>
                        <div class="swiper-pagination"></div>
                        <div class="swiper-button-prev"></div>
                        <div class="swiper-button-next"></div>
                    </div>`
                }

                <div class="btn-group-custom">
                    ${!isPdf ? `<button class="btn-fullscreen" onclick="triggerFullScreen()">⛶ LIHAT FULL LAYAR</button>` : ''}
                    <a href="${urls[0]}" id="downloadLink" download class="btn-download" onclick="event.stopPropagation(); playSuccessSound()">
                        <span>📥 DOWNLOAD FILE</span>
                    </a>
                </div>
            </div>

            <div class="footer-tag">
                LINK GENERATED BY <span class="zaki-name">Y.M.B ASISTEN</span>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
        <script>
            // OFFLINE SUPPORT
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    const code = \`
                        const cacheName = 'ymb-v1';
                        self.addEventListener('install', e => e.waitUntil(caches.open(cacheName).then(c => c.addAll([window.location.href]))));
                        self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
                    \`;
                    const blob = new Blob([code], {type: 'text/javascript'});
                    navigator.serviceWorker.register(URL.createObjectURL(blob));
                });
            }

            // Random Quote Logic
            const quotes = ${JSON.stringify(quotes)};
            const qEl = document.getElementById('randomQuote');
            qEl.innerText = quotes[Math.floor(Math.random() * quotes.length)];

            // Voice: Play Quote (Anywhere click)
            function playQuoteVoice() {
                if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    const msg = new SpeechSynthesisUtterance(qEl.innerText);
                    msg.lang = 'id-ID';
                    window.speechSynthesis.speak(msg);
                }
            }

            // Voice: Play Success Download
            function playSuccessSound() {
                if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    const msg = new SpeechSynthesisUtterance("Terima kasih sudah mendownload file ini, semangat terus ya kak!");
                    msg.lang = 'id-ID';
                    window.speechSynthesis.speak(msg);
                }
            }

            // Fullscreen Logic with Zoom Support
            function triggerFullScreen() {
                const activeImg = document.querySelector('.swiper-slide-active img') || document.querySelector('.media-frame');
                if(activeImg) toggleFullScreen(activeImg);
            }

            function toggleFullScreen(element) {
                if (!document.fullscreenElement) {
                    element.requestFullscreen().catch(err => alert("Error: " + err.message));
                } else {
                    document.exitFullscreen();
                }
            }

            // Swiper Init
            const swiper = new Swiper('.swiper', {
                grabCursor: true,
                centeredSlides: true,
                pagination: { el: '.swiper-pagination', clickable: true },
                navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
                on: {
                    slideChange: function () {
                        const img = this.slides[this.activeIndex].querySelector('img');
                        if (img) document.getElementById('downloadLink').href = img.src;
                    }
                }
            });

            // Offline Check
            window.addEventListener('offline', () => {
                qEl.innerText = "Mode Offline Aktif! File tetap bisa diakses.";
                qEl.style.color = "#ff9800";
            });
        </script>
    </body>
    </html>`;
};

module.exports = { renderMediaView };
