FROM ghcr.io/puppeteer/puppeteer:latest

USER root
WORKDIR /app

# Hapus sisa-sisa file lama jika ada
RUN rm -rf node_modules package-lock.json

# Salin file konfigurasi
COPY package.json ./

# Instal library (tanpa lockfile agar tidak error)
RUN npm install --no-package-lock

# Salin semua kode bot kamu
COPY . .

# Berikan izin tulis (Penting untuk menyimpan session WA)
RUN chmod -R 777 /app

# Jalankan bot
CMD ["node", "index.js"]
