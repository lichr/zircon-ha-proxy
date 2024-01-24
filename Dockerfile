FROM node:latest as builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json .
COPY src ./src

RUN npm run build

FROM node:bullseye-slim as runner

WORKDIR /app

COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY LICENSE README.md package.json package-lock.json ./

# for running as add-on, home assistant will mount options.json to /data/options.json
CMD [ "npm", "start", "--", "--options", "/data/options.json"]
