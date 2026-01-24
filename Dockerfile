FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --no-package-lock --production
COPY . .
RUN apk add --no-cache chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
CMD ["node", "index.js"]
