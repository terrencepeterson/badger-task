FROM node:lts-alpine

WORKDIR /home/node/api

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy rest of the app files
COPY . .

EXPOSE 8001

# Start the app
CMD ["npm", "run", "start"]
