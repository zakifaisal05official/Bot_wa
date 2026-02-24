# Gunakan Node.js versi 20 (LTS Iron)
FROM node:20-bookworm

# 1. Command Cepat: Install GIT & Bersihkan Cache APT dalam satu langkah
RUN apt-get update && apt-get install -y git && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Copy Manifest (Hanya package.json)
# Docker akan stop di sini jika tidak ada perubahan package, jadi npm install tidak diulang
COPY package*.json ./

# 3. Command Cepat: Install semua depedensi sekaligus & Hapus Cache NPM
# Menggunakan --no-audit dan --no-fund agar proses install lebih ringan dan cepat
RUN npm install --no-audit --no-fund && \
    npm install axios form-data --no-audit --no-fund && \
    npm cache clean --force

# 4. Copy sisa kode (Hanya dijalankan jika ada perubahan file .js)
COPY . .

# Command jalankan aplikasi
CMD ["node", "index.js"]
