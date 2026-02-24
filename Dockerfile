# Gunakan Node.js versi 20 (LTS Iron)
FROM node:20-bookworm

# 1. Instal GIT hanya sekali (Layer OS)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Copy package.json TERPISAH sebelum copy kode sumber
# Ini kunci agar Docker tidak mengulang npm install jika package.json tidak berubah
COPY package*.json ./

# 3. Gabungkan semua instalasi library di satu layer
# Ini memastikan axios dan form-data masuk ke dalam cache yang sama dengan library lainnya
RUN npm install && npm install axios form-data

# 4. Baru copy semua file sisa (handler, views, scheduler, dll)
# Layer ini sering berubah, tapi tidak akan memicu 'npm install' ulang karena posisinya di bawah
COPY . .

CMD ["node", "index.js"]
