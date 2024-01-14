# Zircon Studio Proxy

This addon enables access zircon studio web application from home-assistant.

## Features

### Standalone
- Run in container
- Configure via environment variables

### Add On
- Install as home assistant addon
- Configure via options
- Ingress access
- Expose proxy port access (default to 3100)



### Ingress Access

External Url | Proxy Url | Remote Url
-- | -- | --
{`ingress_url`} | / | {`base_url`}/designer

### Proxy Access

External Url | Proxy Url | Remote Url
-- | -- | --
{`ha_host`}:{`proxy_port`}/ | / | {`base_url`}/designer
{`ha_host`}:{`proxy_port`}/zircon/{`path`} | /zircon/{`path`} | {`base_url`}/{`path`}

## Development
### Test Proxy Locally

1. Edit `options.json`

2. Start the proxy
```sh
npm run dev
```

3. Access proxy in browser: <http://localhost:3100>

### Test Add-On Locally

1. `Dev Container: Rebuild and Open in container`
2. `Run Task` -> `Start Home Assistant`
3. Access home assistant via `http://localhost:7123/`
4. Setup home assistant
5. Go to `Settings` -> `Addon`, find `Zircon Studio Proxy` addon in `Local Repository`

[local add-on testing](https://developers.home-assistant.io/docs/add-ons/testing)

## Build Image

```sh
# Build image
docker build -t lichr/zircon-ha-proxy-amd64:1.0.1 -t lichr/zircon-ha-proxy-amd64:latest .

# Publish
docker push
```

## Publish

1. Create a version tag (like 1.0.1) on main branch
2. Go to our [addon repository](https://github.com/lichr/zircon-ha-repository)
   1. Update version in `zircon-studio-proxy/config.yaml`
3. User can update their addon in home assistant ui

