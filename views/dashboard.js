// views/dashboard.js
const os = require("os");

const renderDashboard = (isConnected, qrCodeData, botConfig, stats, logs, port) => {
    const usedRAM = ((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(2);
    const uptime = (os.uptime() / 3600).toFixed(1);

    const commonHead = `
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
            body { background: #ffffff; color: #212529; font-family: -apple-system, sans-serif; }
            .card { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
            .status-online { color: #198754; font-weight: bold; }
            .status-dot { height: 12px; width: 12px; border-radius: 50%; display: inline-block; margin-right: 8px; background-color: #198754; }
            .log-box { 
                background: #ffffff; border-radius: 8px; height: 300px; overflow-y: auto; padding: 15px; 
                font-family: monospace; font-size: 0.9rem; color: #333; 
                border: 1px solid #dee2e6; line-height: 1.6;
            }
            .stats-item { background: #ffffff; border: 1px solid #dee2e6 !important; }
            .stats-item small { color: #ffffff !important; font-weight: 600; font-size: 0.75rem; background: #6c757d; padding: 2px 5px; border-radius: 3px; }
            .btn-refresh { background: #0d6efd; border: none; font-weight: 600; color: white; width: 100%; padding: 12px; border-radius: 8px; }
            .feature-list { background: #ffffff; border-radius: 10px; border: 1px solid #dee2e6; overflow: hidden; }
            .feature-item { display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #eee; }
            .btn-toggle { border: none; padding: 8px 20px; border-radius: 6px; font-weight: bold; font-size: 0.85rem; min-width: 80px; color: white !important; }
            .btn-on { background: #198754; }
            .btn-off { background: #dc3545; }
            .text-white-fixed { color: #ffffff !important; }
        </style>
    `;

    if (isConnected) {
        return `
            <html>
                <head><title>Bot Syteam Panel</title>${commonHead}</head>
                <body class="py-4">
                    <div class="container" style="max-width: 650px;">
                        <div class="card p-4">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <div><h4 class="mb-0">WhatsApp Bot Menu</h4><small class="text-muted">Sistem Aktif (Port ${port})</small></div>
                                <div class="text-end"><span class="status-dot"></span><span class="status-online">TERHUBUNG</span></div>
                            </div>
                            <div class="feature-list mb-4">
                                ${Object.keys(botConfig).map(feat => `
                                    <div class="feature-item">
                                        <span><strong>init${feat.charAt(0).toUpperCase() + feat.slice(1)}Scheduler</strong></span>
                                        <a href="/toggle/${feat}"><button class="btn-toggle ${botConfig[feat] ? 'btn-on' : 'btn-off'}">${botConfig[feat] ? 'ON' : 'OFF'}</button></a>
                                    </div>
                                `).join('')}
                            </div>
                            <div class="row g-2 mb-4 text-center">
                                <div class="col-3"><div class="p-2 rounded stats-item"><small class="d-block text-white-fixed">RAM</small><strong>${usedRAM}G</strong></div></div>
                                <div class="col-3"><div class="p-2 rounded stats-item"><small class="d-block text-white-fixed">UPTIME</small><strong>${uptime}H</strong></div></div>
                                <div class="col-3"><div class="p-2 rounded stats-item"><small class="d-block text-white-fixed">CHAT</small><strong>${stats.pesanMasuk}</strong></div></div>
                                <div class="col-3"><div class="p-2 rounded stats-item"><small class="d-block text-white-fixed">LOGS</small><strong>${stats.totalLog}</strong></div></div>
                            </div>
                            <h6 class="mb-2 text-muted fw-bold small">LOG AKTIVITAS:</h6>
                            <div class="log-box mb-4">${logs.map(l => `<div>${l}</div>`).join('')}</div>
                            <button class="btn-refresh" onclick="location.reload()">REFRESH PANEL</button>
                        </div>
                    </div>
                    <script>setTimeout(() => location.reload(), 20000);</script>
                </body>
            </html>`;
    }

    if (qrCodeData) {
        return `<html><head>${commonHead}</head><body class="d-flex align-items-center justify-content-center vh-100"><div class="card p-5 text-center shadow-sm" style="max-width: 400px; background: white;"><h4>Link WhatsApp</h4><div class="p-3 border rounded mb-3 bg-light"><img src="${qrCodeData}" class="img-fluid"/></div><p class="text-muted small">Scan QR untuk login.</p></div><script>setTimeout(()=>location.reload(), 15000);</script></body></html>`;
    }

    return `<html><head>${commonHead}</head><body class="d-flex align-items-center justify-content-center vh-100 text-center"><div><div class="spinner-border text-primary mb-3"></div><h3 class="text-muted">MEMUAT SISTEM...</h3></div><script>setTimeout(()=>location.reload(), 4000);</script></body></html>`;
};

module.exports = { renderDashboard };
      
