# spotify-http-bridge
Getting Spotify data over Http / Spotifyの再生情報などを提供する Httpサーバ

## Endpoints
| Path | Summary | Method |
| :--- | :--- | :--- |
| /authorize | Login with Spotify | ALL |
| /authorize/revoke | Delete currently credential | DELETE |
| /callback | Redirect endpoint for authorizaiton | GET |
| /me | Response my profile | GET |
| /player | Response player | GET |

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

## LICENSE
iamtakagi/spotify-http-bridge is provided under the MIT license.
