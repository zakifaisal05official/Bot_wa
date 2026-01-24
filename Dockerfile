# Gunakan image resmi yang sudah ada Chrome (Build jauh lebih cepat)
FROM ghcr.io/puppeteer/puppeteer:latest

USER root
WORKDIR /app

# Salin package.json
COPY package.json ./

# Install library hanya untuk produksi agar ringan
RUN npm install --no-package-lock --production

# Salin semua file bot
COPY . .

# Berikan izin akses folder untuk session WA
RUN chmod -R 777 /app

CMD ["node", "index.js"]
