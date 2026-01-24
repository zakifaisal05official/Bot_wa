FROM ghcr.io/puppeteer/puppeteer:latest

USER root
WORKDIR /app

# Gabungkan hapus & install dalam satu langkah untuk menghindari error cache
COPY package.json ./

RUN rm -rf node_modules package-lock.json && \
    npm install --no-package-lock --network-timeout=100000

COPY . .

RUN chmod -R 777 /app

CMD ["node", "index.js"]
