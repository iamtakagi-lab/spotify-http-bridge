# spotify-http-bridge
Getting Spotify data via Http.

## Endpoints
| Path | Summary | Method |
| :--- | :--- | :--- |
| /authorize | Login with Spotify | ALL |
| /authorize/revoke | Delete currently credential | DELETE |
| /callback | Redirect endpoint for authorizaiton | GET |
| /me | Response me profile | GET |
| /playing | Response playing track and details | GET |

## Run
https://hub.docker.com/r/iamtakagi/spotify-http-bridge

```yml
version: '3.8'
services:
  spotify-http-bridge:
    image: iamtakagi/spotify-http-bridge
    environment:
      TZ: Asia/Tokyo
      NODE_ENV: production
      HOST: 0.0.0.0
      PORT: 8080
      SPOTIFY_CLIENT_ID: xxx
      SPOTIFY_CLIENT_SECRET: xxx
      SPOTIFY_REDIRECT_URI: http://localhost:8080/callback
    ports:
      - 8080:8080
    volumes:
      - ./credential.json:/app/credential.json
    restart: unless-stopped
```

### Confirmed Environment
- macOS Big Sur 11.6.1（20G219) 
- Docker 20.10.6, build 370c289
- docker-compose 1.29.1, build c34c88b2
- Node 16
- TypeScript 4.3.5

## LICENSE
iamtakagi/spotify-http-bridge is provided under the MIT license.