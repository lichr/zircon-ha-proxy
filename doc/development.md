# Development

```sh
npm run dev
```

Open designer page in browser: <https://dev.zircon.run/designer/#FrCOUUzBcuCS/bke19Xd6bzoT>

## Test With HA Dev Container

- `Rebuild and Reopen in Container`
- `F1` and choose `Tasks: run task`
- access ha: <http://localhost:7123/>
- install addon
- start addon XX

http://localhost:3100/zircon/designer/#FrCOUUzBcuCS/bke19Xd6bzoT

## Build Local Image

```sh
docker build -t proxy-local .
docker run --rm -p 3100:3100 proxy-local
docker run --rm -it -p 3100:3100 proxy-local /bin/sh

```

## Trouble Shooting

### Key error

```sh
# Check key information
openssl pkcs12 -info -in dev.p12 -noout
```
