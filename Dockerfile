FROM node:latest as builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json .
COPY src ./src

RUN npm run build

FROM node:latest as runner

WORKDIR /app

COPY certs ./certs
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY LICENSE README.md package.json package-lock.json ./


CMD [ "npm", "start", "--", "--options", "/data/options.json"]
