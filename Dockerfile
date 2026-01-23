FROM ghcr.io/puppeteer/puppeteer:latest

USER root
WORKDIR /app

# Pastikan folder bersih total
RUN rm -rf node_modules package-lock.json

# Salin hanya package.json
COPY package.json ./

# Paksa install tanpa lockfile agar tidak mencari npm ci
RUN npm install --no-package-lock

# Salin sisa file lainnya
COPY . .

# Izin tulis untuk session WhatsApp
RUN chmod -R 777 /app

CMD ["node", "index.js"]
