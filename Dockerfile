FROM node:latest as builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json .
COPY src ./src
COPY certs ./certs

CMD [ "npm", "run", "dev" ]
