const SESSION_COOKIE = "lilhwang_session";
const FALLBACK_SECRET = "change-this-session-secret";
const JOBS = {
  swordsman: {
    label: "전사",
    basePower: 2,
    skillName: "배쉬",
    upgradeName: "강철 검 연마",
    verb: "포링을 후려친다",
  },
  mage: {
    label: "마법사",
    basePower: 3,
    skillName: "파이어 볼트",
    upgradeName: "마도서 증폭",
    verb: "마력을 모아 주문을 던진다",
  },
  priest: {
    label: "프리스트",
    basePower: 2,
    skillName: "홀리 라이트",
    upgradeName: "축복 강화",
    verb: "빛의 힘으로 정화한다",
  },
  thief: {
    label: "도적",
    basePower: 2,
    skillName: "더블 어택",
    upgradeName: "은신 단검 세공",
    verb: "그림자처럼 치고 빠진다",
  },
};

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
    const jobClass = normalizeJobClass(body.jobClass);
    validateCredentials(username, password);

    const passwordRecord = await hashPassword(password);
    const db = env.GAME_DB.get(env.GAME_DB.idFromName("main"));
    const result = await db.fetch("https://game-db/register", {
      method: "POST",
      body: JSON.stringify({ username, jobClass, ...passwordRecord }),
    });
    const data = await readJson(result);
    if (!result.ok) return json(data, result.status);

    const session = await createSessionCookie(env, data.user);
    return json({ user: data.user, state: data.state }, 200, { "Set-Cookie": session });
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

    const safeUser = { id: data.user.id, username: data.user.username, jobClass: data.user.jobClass };
    const session = await createSessionCookie(env, safeUser);
    return json({ user: safeUser, state: data.state }, 200, { "Set-Cookie": session });
  }

  if (url.pathname === "/api/logout" && request.method === "POST") {
    return json({ ok: true }, 200, {
      "Set-Cookie": `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure`,
    });
  }

  const session = await readSessionFromRequest(request, env);
  if (!session) return json({ error: "로그인이 필요합니다." }, 401);

  const db = env.GAME_DB.get(env.GAME_DB.idFromName("main"));

  if (url.pathname === "/api/me" && request.method === "GET") {
    const result = await db.fetch(`https://game-db/state?userId=${session.id}`);
    const data = await readJson(result);
    if (!result.ok) return json(data, result.status);
    return json({ user: session, state: data.state });
  }

  if (url.pathname === "/api/game/click" && request.method === "POST") {
    const result = await db.fetch("https://game-db/click", {
      method: "POST",
      body: JSON.stringify({ userId: session.id }),
    });
    const data = await readJson(result);
    return json(data, result.status);
  }

  if (url.pathname === "/api/game/upgrade" && request.method === "POST") {
    const result = await db.fetch("https://game-db/upgrade", {
      method: "POST",
      body: JSON.stringify({ userId: session.id }),
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
        job_class TEXT NOT NULL DEFAULT 'swordsman',
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS game_states (
        user_id INTEGER PRIMARY KEY,
        job_class TEXT NOT NULL DEFAULT 'swordsman',
        coins INTEGER NOT NULL DEFAULT 0,
        total_clicks INTEGER NOT NULL DEFAULT 0,
        click_power INTEGER NOT NULL DEFAULT 1,
        upgrades INTEGER NOT NULL DEFAULT 0,
        level INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
    this.ensureColumn("users", "job_class", "TEXT NOT NULL DEFAULT 'swordsman'");
    this.ensureColumn("game_states", "job_class", "TEXT NOT NULL DEFAULT 'swordsman'");
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/register" && request.method === "POST") {
      const body = await readJson(request);
      const now = new Date().toISOString();
      const jobClass = normalizeJobClass(body.jobClass);
      const existing = this.first("SELECT id FROM users WHERE username = ?", body.username);
      if (existing) return json({ error: "이미 사용 중인 아이디입니다." }, 409);

      this.sql.exec(
        "INSERT INTO users (username, job_class, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?)",
        body.username,
        jobClass,
        body.passwordHash,
        body.passwordSalt,
        now
      );

      const user = this.first(
        "SELECT id, username, job_class AS jobClass FROM users WHERE username = ?",
        body.username
      );

      const job = JOBS[jobClass];
      this.sql.exec(
        "INSERT INTO game_states (user_id, job_class, click_power, updated_at) VALUES (?, ?, ?, ?)",
        user.id,
        jobClass,
        job.basePower,
        now
      );

      return json({ user, state: this.getState(user.id) });
    }

    if (url.pathname === "/login" && request.method === "POST") {
      const body = await readJson(request);
      const user = this.first(
        "SELECT id, username, job_class AS jobClass, password_hash AS passwordHash, password_salt AS passwordSalt FROM users WHERE username = ?",
        body.username
      );
      if (!user) return json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." }, 401);
      return json({ user, state: this.getState(user.id) });
    }

    if (url.pathname === "/state" && request.method === "GET") {
      const state = this.getState(Number(url.searchParams.get("userId")));
      if (!state) return json({ error: "저장된 유저 데이터를 찾지 못했습니다." }, 404);
      return json({ state });
    }

    if (url.pathname === "/click" && request.method === "POST") {
      const body = await readJson(request);
      const state = this.getState(Number(body.userId));
      if (!state) return json({ error: "저장된 유저 데이터를 찾지 못했습니다." }, 404);

      const nextCoins = state.coins + state.clickPower;
      const nextClicks = state.totalClicks + 1;
      const nextLevel = Math.floor(nextClicks / 12) + 1;
      this.updateState(body.userId, {
        ...state,
        coins: nextCoins,
        totalClicks: nextClicks,
        level: nextLevel,
      });

      return json({ gained: state.clickPower, state: this.getState(Number(body.userId)) });
    }

    if (url.pathname === "/upgrade" && request.method === "POST") {
      const body = await readJson(request);
      const state = this.getState(Number(body.userId));
      if (!state) return json({ error: "저장된 유저 데이터를 찾지 못했습니다." }, 404);

      const cost = this.getUpgradeCost(state.upgrades, state.jobClass);
      if (state.coins < cost) {
        return json({ error: `제니가 부족합니다. 현재 비용은 ${cost}입니다.` }, 400);
      }

      this.updateState(body.userId, {
        ...state,
        coins: state.coins - cost,
        clickPower: state.clickPower + 1,
        upgrades: state.upgrades + 1,
      });

      return json({ state: this.getState(Number(body.userId)) });
    }

    return json({ error: "알 수 없는 요청입니다." }, 404);
  }

  ensureColumn(table, column, definition) {
    const columns = [...this.sql.exec(`PRAGMA table_info(${table})`)];
    if (!columns.some((entry) => entry.name === column)) {
      this.sql.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }

  first(query, ...params) {
    const cursor = this.sql.exec(query, ...params);
    return [...cursor][0] || null;
  }

  getState(userId) {
    const row = this.first(
      "SELECT user_id AS userId, job_class AS jobClass, coins, total_clicks AS totalClicks, click_power AS clickPower, upgrades, level FROM game_states WHERE user_id = ?",
      userId
    );
    if (!row) return null;
    const job = JOBS[row.jobClass] || JOBS.swordsman;
    return {
      ...row,
      jobLabel: job.label,
      skillName: job.skillName,
      upgradeName: job.upgradeName,
      flavorText: job.verb,
      upgradeCost: this.getUpgradeCost(row.upgrades, row.jobClass),
    };
  }

  updateState(userId, next) {
    this.sql.exec(
      `UPDATE game_states
       SET job_class = ?, coins = ?, total_clicks = ?, click_power = ?, upgrades = ?, level = ?, updated_at = ?
       WHERE user_id = ?`,
      next.jobClass,
      next.coins,
      next.totalClicks,
      next.clickPower,
      next.upgrades,
      next.level,
      new Date().toISOString(),
      userId
    );
  }

  getUpgradeCost(upgrades, jobClass) {
    const base = jobClass === "mage" ? 12 : 10;
    return base + upgrades * 9;
  }
}

function normalizeUsername(input) {
  return String(input || "").trim().toLowerCase();
}

function normalizeJobClass(input) {
  const value = String(input || "").trim().toLowerCase();
  return JOBS[value] ? value : "swordsman";
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
  return { passwordSalt: salt, passwordHash: hash };
}

async function verifyPassword(password, salt, expectedHash) {
  return (await sha256(`${salt}:${password}`)) === expectedHash;
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
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const signature = await signValue(env, encoded);
  return `${SESSION_COOKIE}=${encoded}.${signature}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax; Secure`;
}

async function readSessionFromRequest(request, env) {
  const cookies = parseCookieHeader(request.headers.get("Cookie") || "");
  const raw = cookies[SESSION_COOKIE];
  if (!raw) return null;
  const [encoded, signature] = raw.split(".");
  if (!encoded || !signature) return null;
  if ((await signValue(env, encoded)) !== signature) return null;
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
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return base64UrlEncodeBytes(new Uint8Array(signature));
}

function parseCookieHeader(header) {
  return header.split(/;\s*/).reduce((acc, entry) => {
    const idx = entry.indexOf("=");
    if (idx !== -1) acc[entry.slice(0, idx)] = entry.slice(idx + 1);
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
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
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
