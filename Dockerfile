FROM ghcr.io/puppeteer/puppeteer:latest

USER root
WORKDIR /app

# Salin package json
COPY package*.json ./

# Install dependensi
RUN npm install

# Salin semua kode bot
COPY . .

# Berikan izin akses folder
RUN chmod -R 777 /app

# Jalankan aplikasi
CMD ["node", "index.js"]
