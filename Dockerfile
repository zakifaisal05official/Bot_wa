FROM ghcr.io/puppeteer/puppeteer:latest

USER root
WORKDIR /app

# Bersihkan folder dari file sampah github
RUN rm -rf node_modules package-lock.json

COPY package.json ./

# Gunakan install biasa, bukan ci
RUN npm install --no-package-lock

COPY . .

RUN chmod -R 777 /app

CMD ["node", "index.js"]
