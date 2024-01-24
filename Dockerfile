FROM node:latest as builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json .
COPY src ./src

RUN npm run build

FROM node:bullseye-slim as runner

WORKDIR /app

# this is only used for development, this file should not be checked in
COPY options-zircon*.json ./
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY LICENSE README.md package.json package-lock.json ./


CMD [ "npm", "start", "--", "--options", "/data/options.json", "--zircon-options", "options-zircon.json"]
