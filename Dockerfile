FROM node:18-slim

# Instal GIT agar npm install tidak error spawn git
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

# Sekarang npm install pasti lancar karena git sudah ada
RUN npm install

COPY . .

CMD ["node", "index.js"]
