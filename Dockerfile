FROM ghcr.io/puppeteer/puppeteer:latest

USER root
WORKDIR /app

# Salin file package saja dulu
COPY package.json ./

# Pakai npm install biasa agar lebih fleksibel
RUN npm install

# Baru salin semua file lainnya
COPY . .

# Berikan izin akses folder
RUN chmod -R 777 /app

# Jalankan bot
CMD ["node", "index.js"]
