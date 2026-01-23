FROM ghcr.io/puppeteer/puppeteer:latest

USER root
WORKDIR /app

# Salin file package
COPY package*.json ./

# Install dengan clean-install
RUN npm ci

# Salin semua file bot
COPY . .

# Pastikan bot punya izin akses
RUN chmod -R 777 /app

# Jalankan bot
CMD ["node", "index.js"]
