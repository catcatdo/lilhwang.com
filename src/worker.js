const SESSION_COOKIE = "lilhwang_session";
const FALLBACK_SECRET = "change-this-session-secret";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, env, url);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleApi(request, env, url) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  if (url.pathname === "/api/register" && request.method === "POST") {
    const body = await readJson(request);
    const username = normalizeUsername(body.username);
    const password = String(body.password || "");
    validateCredentials(username, password);

    const passwordRecord = await hashPassword(password);
    const db = env.GAME_DB.get(env.GAME_DB.idFromName("main"));
    const result = await db.fetch("https://game-db/register", {
      method: "POST",
      body: JSON.stringify({ username, ...passwordRecord }),
    });
    const data = await readJson(result);
    if (!result.ok) return json(data, result.status);

    const session = await createSessionCookie(env, {
      userId: data.user.id,
      username: data.user.username,
    });

    return json(
      { user: data.user, state: data.state },
      200,
      { "Set-Cookie": session }
    );
  }

  if (url.pathname === "/api/login" && request.method === "POST") {
    const body = await readJson(request);
    const username = normalizeUsername(body.username);
    const password = String(body.password || "");
    validateCredentials(username, password);

    const db = env.GAME_DB.get(env.GAME_DB.idFromName("main"));
    const result = await db.fetch("https://game-db/login", {
      method: "POST",
      body: JSON.stringify({ username }),
    });
    const data = await readJson(result);
    if (!result.ok) return json(data, result.status);

    const ok = await verifyPassword(password, data.user.passwordSalt, data.user.passwordHash);
    if (!ok) {
      return json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." }, 401);
    }

    const session = await createSessionCookie(env, {
      userId: data.user.id,
      username: data.user.username,
    });

    return json(
      {
        user: { id: data.user.id, username: data.user.username },
        state: data.state,
      },
      200,
      { "Set-Cookie": session }
    );
  }

  if (url.pathname === "/api/logout" && request.method === "POST") {
    return json({ ok: true }, 200, {
      "Set-Cookie": `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure`,
    });
  }

  const session = await readSessionFromRequest(request, env);
  if (!session) {
    return json({ error: "로그인이 필요합니다." }, 401);
  }

  const db = env.GAME_DB.get(env.GAME_DB.idFromName("main"));

  if (url.pathname === "/api/me" && request.method === "GET") {
    const result = await db.fetch(`https://game-db/state?userId=${session.userId}`);
    const data = await readJson(result);
    if (!result.ok) return json(data, result.status);

    return json({
      user: { id: session.userId, username: session.username },
      state: data.state,
    });
  }

  if (url.pathname === "/api/game/click" && request.method === "POST") {
    const result = await db.fetch("https://game-db/click", {
      method: "POST",
      body: JSON.stringify({ userId: session.userId }),
    });
    const data = await readJson(result);
    return json(data, result.status);
  }

  if (url.pathname === "/api/game/upgrade" && request.method === "POST") {
    const result = await db.fetch("https://game-db/upgrade", {
      method: "POST",
      body: JSON.stringify({ userId: session.userId }),
    });
    const data = await readJson(result);
    return json(data, result.status);
  }

  return json({ error: "알 수 없는 요청입니다." }, 404);
}

export class GameDatabase {
  constructor(state) {
    this.state = state;
    this.sql = state.storage.sql;
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS game_states (
        user_id INTEGER PRIMARY KEY,
        coins INTEGER NOT NULL DEFAULT 0,
        total_clicks INTEGER NOT NULL DEFAULT 0,
        click_power INTEGER NOT NULL DEFAULT 1,
        upgrades INTEGER NOT NULL DEFAULT 0,
        level INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/register" && request.method === "POST") {
      const body = await readJson(request);
      const now = new Date().toISOString();

      const existing = this.first(
        "SELECT id FROM users WHERE username = ?",
        body.username
      );
      if (existing) {
        return json({ error: "이미 사용 중인 아이디입니다." }, 409);
      }

      this.sql.exec(
        "INSERT INTO users (username, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?)",
        body.username,
        body.passwordHash,
        body.passwordSalt,
        now
      );

      const user = this.first(
        "SELECT id, username FROM users WHERE username = ?",
        body.username
      );

      this.sql.exec(
        "INSERT INTO game_states (user_id, updated_at) VALUES (?, ?)",
        user.id,
        now
      );

      return json({ user, state: this.getState(user.id) });
    }

    if (url.pathname === "/login" && request.method === "POST") {
      const body = await readJson(request);
      const user = this.first(
        "SELECT id, username, password_hash AS passwordHash, password_salt AS passwordSalt FROM users WHERE username = ?",
        body.username
      );
      if (!user) {
        return json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." }, 401);
      }

      return json({ user, state: this.getState(user.id) });
    }

    if (url.pathname === "/state" && request.method === "GET") {
      const userId = Number(url.searchParams.get("userId"));
      const state = this.getState(userId);
      if (!state) {
        return json({ error: "저장된 유저 데이터를 찾지 못했습니다." }, 404);
      }
      return json({ state });
    }

    if (url.pathname === "/click" && request.method === "POST") {
      const body = await readJson(request);
      const state = this.getState(Number(body.userId));
      if (!state) {
        return json({ error: "저장된 유저 데이터를 찾지 못했습니다." }, 404);
      }

      const nextCoins = state.coins + state.clickPower;
      const nextClicks = state.totalClicks + 1;
      const nextLevel = Math.floor(nextClicks / 15) + 1;
      this.updateState(body.userId, {
        coins: nextCoins,
        totalClicks: nextClicks,
        clickPower: state.clickPower,
        upgrades: state.upgrades,
        level: nextLevel,
      });

      return json({
        gained: state.clickPower,
        state: this.getState(Number(body.userId)),
      });
    }

    if (url.pathname === "/upgrade" && request.method === "POST") {
      const body = await readJson(request);
      const state = this.getState(Number(body.userId));
      if (!state) {
        return json({ error: "저장된 유저 데이터를 찾지 못했습니다." }, 404);
      }

      const cost = this.getUpgradeCost(state.upgrades);
      if (state.coins < cost) {
        return json({ error: `포인트가 부족합니다. 현재 비용은 ${cost}입니다.` }, 400);
      }

      this.updateState(body.userId, {
        coins: state.coins - cost,
        totalClicks: state.totalClicks,
        clickPower: state.clickPower + 1,
        upgrades: state.upgrades + 1,
        level: state.level,
      });

      return json({ state: this.getState(Number(body.userId)) });
    }

    return json({ error: "알 수 없는 요청입니다." }, 404);
  }

  first(query, ...params) {
    const cursor = this.sql.exec(query, ...params);
    const rows = [...cursor];
    return rows[0] || null;
  }

  getState(userId) {
    const row = this.first(
      "SELECT user_id AS userId, coins, total_clicks AS totalClicks, click_power AS clickPower, upgrades, level FROM game_states WHERE user_id = ?",
      userId
    );
    if (!row) return null;

    return {
      ...row,
      upgradeCost: this.getUpgradeCost(row.upgrades),
    };
  }

  updateState(userId, next) {
    this.sql.exec(
      `UPDATE game_states
       SET coins = ?, total_clicks = ?, click_power = ?, upgrades = ?, level = ?, updated_at = ?
       WHERE user_id = ?`,
      next.coins,
      next.totalClicks,
      next.clickPower,
      next.upgrades,
      next.level,
      new Date().toISOString(),
      userId
    );
  }

  getUpgradeCost(upgrades) {
    return 10 + upgrades * 8;
  }
}

function normalizeUsername(input) {
  return String(input || "").trim().toLowerCase();
}

function validateCredentials(username, password) {
  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    throw new Error("아이디는 영문 소문자, 숫자, 밑줄만 사용할 수 있고 3~24자여야 합니다.");
  }
  if (password.length < 6) {
    throw new Error("비밀번호는 6자 이상이어야 합니다.");
  }
}

async function hashPassword(password) {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = toHex(saltBytes);
  const hash = await sha256(`${salt}:${password}`);
  return {
    passwordSalt: salt,
    passwordHash: hash,
  };
}

async function verifyPassword(password, salt, expectedHash) {
  const hash = await sha256(`${salt}:${password}`);
  return hash === expectedHash;
}

async function sha256(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(digest));
}

function toHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function createSessionCookie(env, payload) {
  const jsonPayload = JSON.stringify(payload);
  const encoded = base64UrlEncode(jsonPayload);
  const signature = await signValue(env, encoded);
  return `${SESSION_COOKIE}=${encoded}.${signature}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax; Secure`;
}

async function readSessionFromRequest(request, env) {
  const cookies = parseCookieHeader(request.headers.get("Cookie") || "");
  const raw = cookies[SESSION_COOKIE];
  if (!raw) return null;

  const [encoded, signature] = raw.split(".");
  if (!encoded || !signature) return null;

  const expected = await signValue(env, encoded);
  if (expected !== signature) return null;

  try {
    return JSON.parse(base64UrlDecode(encoded));
  } catch {
    return null;
  }
}

async function signValue(env, value) {
  const secret = env.SESSION_SECRET || FALLBACK_SECRET;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );
  return base64UrlEncodeBytes(new Uint8Array(signature));
}

function parseCookieHeader(header) {
  return header.split(/;\s*/).reduce((acc, entry) => {
    const idx = entry.indexOf("=");
    if (idx === -1) return acc;
    acc[entry.slice(0, idx)] = entry.slice(idx + 1);
    return acc;
  }, {});
}

function base64UrlEncode(value) {
  return base64UrlEncodeBytes(new TextEncoder().encode(value));
}

function base64UrlEncodeBytes(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function readJson(requestOrResponse) {
  try {
    return await requestOrResponse.json();
  } catch {
    return {};
  }
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}
