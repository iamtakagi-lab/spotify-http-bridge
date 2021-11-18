import Koa, { Context, Next } from "koa";
import Router from "koa-router";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";
import fs from "fs";
import path from "path";
import SpotifyWebApi from "spotify-web-api-node";

type Playing = {
  track: SpotifyApi.CurrentlyPlayingResponse;
  details: SpotifyApi.SingleTrackResponse;
};

interface ISpotifyToken {
  accessToken: string | null;
  refreshToken: string | null;
  createdAt: number;
}

const SPOTIFY_TOKEN_AGE = 3600 * 1000;

class SpotifyToken implements ISpotifyToken {
  accessToken: string | null = null;
  refreshToken: string | null = null;
  createdAt: number = 0;

  constructor() {
    Promise.resolve(
      JSON.parse(
        fs.readFileSync(path.join(__dirname, "..", "token.json"), "utf8")
      ) as ISpotifyToken
    ).then((read) => {
      const { accessToken, refreshToken, createdAt } = read;
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.createdAt = createdAt;
    });
  }

  save() {
    fs.writeFileSync(
      path.join(__dirname, "..", "token.json"),
      JSON.stringify(this),
      "utf8"
    );
  }

  setToken({ accessToken, refreshToken, createdAt }: ISpotifyToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.createdAt = createdAt;
    if (accessToken && refreshToken) {
      spotify.setAccessToken(accessToken);
      spotify.setRefreshToken(accessToken);
    }
  }

  setAccessToken(accessToken: ISpotifyToken["accessToken"]) {
    this.accessToken = accessToken;
  }

  setRefreshToken(refreshToken: ISpotifyToken["refreshToken"]) {
    this.refreshToken = refreshToken;
  }

  setCreatedAt(createdAt: number) {
    this.createdAt = createdAt;
  }

  isExpired() {
    return Date.now() >= this.createdAt + SPOTIFY_TOKEN_AGE;
  }

  async refresh() {
    const ref = (await spotify.refreshAccessToken()).body;
    const accessToken = ref.access_token;
    const refreshToken = ref.refresh_token;
    if (accessToken) {
      this.setAccessToken(accessToken);
      spotify.setAccessToken(accessToken);
    }
    if (refreshToken) {
      this.setRefreshToken(refreshToken);
      spotify.setRefreshToken(refreshToken);
    }
    this.createdAt = Date.now();
    this.save();
  }

  reset() {
    this.accessToken = null;
    this.refreshToken = null;
    this.createdAt = 0;
  }
}

const generateRandomString = (length: number) => {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

const getMe = async () => {
  return new Promise<SpotifyApi.CurrentUsersProfileResponse | null>(
    (resolve) => {
      const { accessToken, refreshToken } = token;
      if (
        !accessToken ||
        !refreshToken ||
        accessToken.length <= 0 ||
        refreshToken.length <= 0
      )
        return resolve(null);

      if (token.isExpired()) {
        token.refresh();
      }

      spotify.setAccessToken(accessToken);
      spotify.setRefreshToken(refreshToken);

      spotify
        .getMe()
        .then((data) => {
          return data.body;
        })
        .then((me) => {
          resolve(me);
        })
        .catch((e) => {
          console.log(e);
        });
    }
  );
};

const getPlayer = async () => {
  return new Promise<Playing | null>((resolve) => {
    const { accessToken, refreshToken } = token;
    if (
      !accessToken ||
      !refreshToken ||
      accessToken.length <= 0 ||
      refreshToken.length <= 0
    )
      return resolve(null);

    if (token.isExpired()) {
      token.refresh();
    }

    spotify.setAccessToken(accessToken);
    spotify.setRefreshToken(refreshToken);

    spotify
      .getMyCurrentPlaybackState()
      .then((data) => {
        return data.body;
      })
      .then(async (track) => {
        if (!track || !track.item) return resolve(null);
        const details = (await spotify.getTrack(track.item.id)).body;
        resolve({ track, details });
      })
      .catch((e) => {
        console.log(e);
      });
  });
};

const koa = new Koa();
const router = new Router();
const token = new SpotifyToken();
const spotify = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});
const { accessToken, refreshToken } = token;
if (accessToken) {
  spotify.setAccessToken(accessToken);
}
if (refreshToken) {
  spotify.setRefreshToken(refreshToken);
}

router.all("/authorize", async (ctx: Context) => {
  const state = generateRandomString(16);
  const scope = ["user-read-private", "user-read-playback-state"];
  spotify.createAuthorizeURL(scope, state);
  ctx.cookies.set("state", state);
  ctx.redirect(spotify.createAuthorizeURL(scope, generateRandomString(16)));
});

router.delete("/authorize/revoke", async (ctx: Context) => {
  token.reset();
  token.save();
  ctx.status = 200;
});

router.get("/callback", async (ctx: Context, next: Next) => {
  let { code } = ctx.query;
  if (code && typeof code === "string") {
    spotify
      .authorizationCodeGrant(code)
      .then((res) => {
        return res.body;
      })
      .then(async (data) => {
        token.setToken({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          createdAt: Date.now(),
        });
        token.save();
      })
      .catch((e: Error) => {
        console.error("Error: ", e, e.stack);
      });
    ctx.redirect("/me");
  } else {
    next();
  }
});

router.get("/me", async (ctx: Context) => {
  const me = await getMe();
  if (!me) return (ctx.status = 401);
  ctx.body = me;
  ctx.set("Content-Type", "application/json");
});

router.get("/player", async (ctx: Context) => {
  const me = await getMe();
  if (!me) return (ctx.status = 401);
  const player = await getPlayer();
  ctx.body = JSON.stringify(player);
  ctx.set("Content-Type", "application/json");
});

koa
  .use(bodyParser())
  .use(cors())
  .use(router.allowedMethods())
  .use(router.routes());

koa.listen(process.env.PORT, () => {
  console.info(
    `API server listening on ${process.env.HOST}:${process.env.PORT}, in ${process.env.NODE_ENV}`
  );
  getMe().then((me) => {
    if (me) console.info(`Authenticated as ${me.display_name || me.id}`);
  });
});
