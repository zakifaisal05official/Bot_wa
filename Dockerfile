FROM ghcr.io/puppeteer/puppeteer:latest

USER root
WORKDIR /app

# Hanya salin package.json
COPY package.json ./

# Pakai install biasa agar Railway tidak rewel soal lockfile
RUN npm install

# Salin semua file bot
COPY . .

# Berikan izin folder agar session bisa tersimpan
RUN chmod -R 777 /app

# Jalankan perintah start
CMD ["npm", "start"]
