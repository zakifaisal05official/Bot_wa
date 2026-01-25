FROM node:18-slim

# Instal tools dan browser Chromium untuk Linux
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-freefont-ttf \
    libxss1 \
    libasound2 \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Beri tahu Puppeteer lokasi browsernya
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Jalankan bot
CMD ["node", "index.js"]
