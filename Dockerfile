FROM ghcr.io/puppeteer/puppeteer:latest

USER root
WORKDIR /app

# Paksa hapus file lock agar tidak memicu 'npm ci'
RUN rm -f package-lock.json

COPY package.json ./

# Install bersih tanpa peduli file lock lama
RUN npm install --no-package-lock

COPY . .

RUN chmod -R 777 /app

CMD ["node", "index.js"]
