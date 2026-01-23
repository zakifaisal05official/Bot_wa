FROM ghcr.io/puppeteer/puppeteer:latest

USER root
WORKDIR /app

# Salin package.json saja
COPY package.json ./

# Pakai install biasa agar Railway yang buat filenya
RUN npm install

# Baru salin semua file lainnya
COPY . .

# Berikan izin akses penuh ke folder
RUN chmod -R 777 /app

# Jalankan bot
CMD ["node", "index.js"]
