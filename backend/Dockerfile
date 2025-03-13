FROM node:lts-alpine

WORKDIR /home/node/api

COPY package.json package-lock.json ./

COPY . .

EXPOSE 8001

CMD ["sh", "-c", "npm install && npm start"]
