FROM node:20-bookworm

# Instal git untuk Baileys
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Railway secara otomatis akan me-restart CMD ini jika proses exit
CMD ["node", "index.js"]
