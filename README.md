# spotify-http-bridge
Getting Spotify data over Http / Spotifyの再生情報などを提供する Httpサーバ

## Endpoints
| Path | Summary | Method | Origin
| :--- | :--- | :--- | :---
| /authorize | Login with Spotify | ALL | https://accounts.spotify.com/authorize
| /authorize/revoke | Delete local token | DELETE |
| /callback | Redirect endpoint for authorizaiton | GET |
| /me | Response my profile | GET | /v1/me
| /player | Response player | GET | /v1/me/player

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
      - ./token.json:/app/token.json
    restart: unless-stopped
```

## LICENSE
iamtakagi/spotify-http-bridge is provided under the MIT license.
