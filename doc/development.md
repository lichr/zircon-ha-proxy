# Development

```sh
yarn dev
```

Open designer page in browser:
- <http://localhost:11200>

The target url should be:
- <https://dev.zircon.run/designer/#FrCOUUzBcuCS/bke19Xd6bzoT>

## Test With HA Dev Container

- `Rebuild and Reopen in Container`
- `F1` and choose `Tasks: run task`,  
- access ha: <http://localhost:7123/>
- install addon
- start addon XX


## Build Local Image

```sh
docker build -t proxy-local .
docker run --rm -p 11200:11200 proxy-local
docker run --rm -it -p 11200:11200 proxy-local /bin/sh

```
## Build Image and Push to Registry

```sh
docker build -t lichr/zircon-studio-ha-proxy-amd64:1.0.0 -t lichr/zircon-studio-ha-proxy-amd64:latest .
docker push --all-tags lichr/zircon-studio-ha-proxy-amd64

```

## Trouble Shooting

### Key error

```sh
# Check key information
openssl pkcs12 -info -in dev.p12 -noout
```
