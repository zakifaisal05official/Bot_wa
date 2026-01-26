FROM node:18-slim

# Instal GIT (Wajib agar tidak error spawn git)
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy sisa file project
COPY . .

# Jalankan bot
CMD ["node", "index.js"]
