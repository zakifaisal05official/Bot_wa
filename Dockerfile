FROM ghcr.io/puppeteer/puppeteer:latest

USER root
WORKDIR /app

# Bersihkan sisa build lama
RUN rm -rf node_modules package-lock.json

# Salin package.json
COPY package.json ./

# Install library tanpa meminta lockfile
RUN npm install --no-package-lock

# Salin semua file project
COPY . .

# Berikan izin akses folder untuk menyimpan session WhatsApp
RUN chmod -R 777 /app

# Jalankan bot
CMD ["node", "index.js"]
