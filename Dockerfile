# Gunakan Node.js versi 20
FROM node:20-bookworm

# Instal GIT dan alat build esensial (beberapa library WA butuh ini)
RUN apt-get update && apt-get install -y \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Salin package manager files
COPY package*.json ./

# Instal dependensi (menggunakan --frozen-lockfile jika ada yarn, atau npm ci lebih stabil)
RUN npm install

# Salin semua file ke dalam folder kerja
COPY . .

# Port yang digunakan (sesuaikan dengan kode express kamu)
EXPOSE 3000

# Perintah menjalankan bot
CMD ["node", "index.js"]
