# Zircon Studio Proxy

This addon enables access zircon studio web application from home-assistant.

## Features
- Ingress access
- Proxy port access (default to 3100)
- Auto sign in to zircon studio
- Configure group_id and project_id in options
- Use client certificate if upstream server is required

### Ingress Access

External Url | Proxy Url | Remote Url
-- | -- | --
{`ingress_url`} | / | {`base_url`}/designer

### Proxy Access

External Url | Proxy Url | Remote Url
-- | -- | --
{`ha_host`}:{`proxy_port`}/ | / | {`base_url`}/designer
{`ha_host`}:{`proxy_port`}/zircon/{`path`} | /zircon/{`path`} | {`base_url`}/{`path`}

