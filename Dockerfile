# Gunakan image resmi Puppeteer yang sudah ada Chrome (Build jauh lebih cepat)
FROM ghcr.io/puppeteer/puppeteer:latest

# Tetap root untuk setup awal
USER root
WORKDIR /app

# Salin package.json dulu untuk cache layer
COPY package.json ./

# Install dependencies hanya untuk production (ringan dan cepat)
RUN npm install --no-package-lock --production

# Salin semua file bot (setelah install, agar cache bekerja)
COPY . .

# Berikan izin akses folder untuk session WA (misalnya untuk penyimpanan QR code atau session)
RUN chmod -R 777 /app

# Switch ke user non-root untuk keamanan (pptruser sudah ada di image Puppeteer)
USER pptruser

# Jalankan bot
CMD ["node", "index.js"]
