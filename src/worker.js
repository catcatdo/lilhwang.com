const SESSION_COOKIE = "lilhwang_session";
const FALLBACK_SECRET = "change-this-session-secret";

const JOBS = {
  swordsman: { label: "전사", maxHp: 42, baseAttack: 7, flavor: "무게감 있는 한 방으로 전선을 밀어붙입니다." },
  mage: { label: "마법사", maxHp: 28, baseAttack: 9, flavor: "강한 속성 공격으로 전투를 빠르게 끝냅니다." },
  priest: { label: "프리스트", maxHp: 34, baseAttack: 6, flavor: "빛의 힘과 회복으로 전투를 오래 버팁니다." },
  thief: { label: "도적", maxHp: 30, baseAttack: 8, flavor: "빠르고 예리한 연속 공격으로 적을 흔듭니다." },
};

const JOB_SKILLS = {
  swordsman: [
    { id: "bash", name: "배쉬", type: "attack", power: 1.25, text: "무겁게 내려쳐 큰 피해를 줍니다." },
    { id: "guard", name: "가드", type: "guard", shield: 7, text: "다음 공격에 대비해 피해를 줄입니다." },
    { id: "wide_slash", name: "와이드 슬래시", type: "attack", power: 1.55, text: "넓게 베어 강한 피해를 줍니다.", learnLevel: 2 },
    { id: "battle_cry", name: "배틀 크라이", type: "buff", attackBuff: 2, text: "전의를 끌어올려 기본 공격력을 높입니다.", learnLevel: 4 },
    { id: "meteor_crush", name: "메테오 크러시", type: "attack", power: 2.05, text: "거대한 일격으로 적을 압도합니다.", learnLevel: 6 },
  ],
  mage: [
    { id: "fire_bolt", name: "파이어 볼트", type: "attack", power: 1.35, text: "집중된 화염탄으로 적을 태웁니다." },
    { id: "mana_shield", name: "마나 실드", type: "guard", shield: 6, text: "마력 방어막으로 피해를 줄입니다." },
    { id: "ice_lance", name: "아이스 랜스", type: "attack", power: 1.65, text: "얼음 창으로 강한 단일 피해를 줍니다.", learnLevel: 2 },
    { id: "arcane_surge", name: "아케인 서지", type: "buff", attackBuff: 3, text: "마력을 폭주시켜 주문 위력을 강화합니다.", learnLevel: 4 },
    { id: "meteor_stormlet", name: "미니 메테오", type: "attack", power: 2.15, text: "작은 유성 다발로 적을 무너뜨립니다.", learnLevel: 6 },
  ],
  priest: [
    { id: "holy_light", name: "홀리 라이트", type: "attack", power: 1.2, text: "빛의 기둥으로 적을 정화합니다." },
    { id: "heal", name: "힐", type: "heal", heal: 10, text: "자신의 체력을 회복합니다." },
    { id: "blessing", name: "블레싱", type: "buff", attackBuff: 2, heal: 4, text: "축복과 함께 회복하고 위력을 높입니다.", learnLevel: 2 },
    { id: "sanctuary", name: "생츄어리", type: "guard", shield: 10, heal: 6, text: "성역을 펼쳐 피해를 줄이고 회복합니다.", learnLevel: 4 },
    { id: "judex", name: "주덱스", type: "attack", power: 1.95, text: "강한 심판의 빛을 떨어뜨립니다.", learnLevel: 6 },
  ],
  thief: [
    { id: "double_attack", name: "더블 어택", type: "attack", power: 1.3, text: "빠른 연속 공격을 가합니다." },
    { id: "evasion", name: "회피", type: "guard", shield: 8, text: "민첩하게 몸을 틀어 피해를 줄입니다." },
    { id: "poison_edge", name: "포이즌 엣지", type: "attack", power: 1.55, text: "독이 스민 일격으로 큰 피해를 줍니다.", learnLevel: 2 },
    { id: "shadow_step", name: "섀도우 스텝", type: "buff", attackBuff: 2, shield: 4, text: "그림자 속을 미끄러지며 전열을 흐립니다.", learnLevel: 4 },
    { id: "phantom_rush", name: "팬텀 러시", type: "attack", power: 2.0, text: "눈에 보이지 않는 속도로 돌진합니다.", learnLevel: 6 },
  ],
};

const AREAS = {
  meadow: { key: "meadow", name: "루미 메도우", minLevel: 1, flavor: "밝고 평화로운 초보자 필드입니다.", monsters: ["dew_maru", "pinki", "mossbit", "sunflit"] },
  grove: { key: "grove", name: "윈드 그로브", minLevel: 3, flavor: "나무 정령과 작은 야수가 숨어 있는 숲입니다.", monsters: ["twiggle", "glowmoth", "mossbit", "barkoon"] },
  catacomb: { key: "catacomb", name: "문스톤 지하묘지", minLevel: 5, flavor: "불길한 언데드와 그림자가 배회하는 묘지입니다.", monsters: ["bonepup", "candlewisp", "grimcap", "shadeclaw"] },
};

const MONSTERS = {
  dew_maru: { name: "듀마루", maxHp: 18, attack: 3, reward: 4, exp: 5, vibe: "이슬을 머금은 둥근 젤리 몬스터" },
  pinki: { name: "핑키볼", maxHp: 20, attack: 4, reward: 5, exp: 6, vibe: "분홍빛으로 통통 튀는 초원 슬라임" },
  mossbit: { name: "모스빗", maxHp: 24, attack: 4, reward: 6, exp: 7, vibe: "작은 이빨과 이끼를 두른 숲의 짐승" },
  sunflit: { name: "선플릿", maxHp: 22, attack: 5, reward: 6, exp: 7, vibe: "햇빛을 받아 반짝이는 작은 날개 정령" },
  twiggle: { name: "트위글", maxHp: 30, attack: 6, reward: 8, exp: 10, vibe: "휘청거리며 달려오는 나뭇가지 골렘" },
  glowmoth: { name: "글로우모스", maxHp: 28, attack: 6, reward: 8, exp: 10, vibe: "은은한 인광을 흩뿌리는 밤나방" },
  barkoon: { name: "바쿠른", maxHp: 36, attack: 7, reward: 10, exp: 12, vibe: "굵은 껍질을 두른 숲의 수호수" },
  bonepup: { name: "본펍", maxHp: 42, attack: 8, reward: 12, exp: 15, vibe: "묘지 사이를 뛰노는 뼈 강아지" },
  candlewisp: { name: "캔들위습", maxHp: 44, attack: 8, reward: 13, exp: 16, vibe: "꺼지지 않는 푸른 불꽃의 혼령" },
  grimcap: { name: "그림캡", maxHp: 48, attack: 9, reward: 15, exp: 18, vibe: "독기를 품은 버섯형 야수" },
  shadeclaw: { name: "셰이드클로", maxHp: 54, attack: 11, reward: 18, exp: 22, vibe: "지하묘지 깊은 곳을 어슬렁대는 그림자 맹수" },
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) return handleApi(request, env, url);
    return env.ASSETS.fetch(request);
  },
};

async function handleApi(request, env, url) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });

  if (url.pathname === "/api/register" && request.method === "POST") {
    const body = await readJson(request);
    const username = normalizeUsername(body.username);
    const password = String(body.password || "");
    const jobClass = normalizeJobClass(body.jobClass);
    validateCredentials(username, password);

    const db = env.GAME_DB.get(env.GAME_DB.idFromName("main"));
    const passwordRecord = await hashPassword(password);
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
    if (!ok) return json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." }, 401);
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
    return json({ user: session, state: data.state }, result.status);
  }

  if (url.pathname === "/api/game/use-skill" && request.method === "POST") {
    const body = await readJson(request);
    const result = await db.fetch("https://game-db/use-skill", {
      method: "POST",
      body: JSON.stringify({ userId: session.id, skillId: body.skillId }),
    });
    const data = await readJson(result);
    return json(data, result.status);
  }

  if (url.pathname === "/api/game/replace-skill" && request.method === "POST") {
    const body = await readJson(request);
    const result = await db.fetch("https://game-db/replace-skill", {
      method: "POST",
      body: JSON.stringify({ userId: session.id, replaceSkillId: body.replaceSkillId }),
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

  if (url.pathname === "/api/game/area" && request.method === "POST") {
    const body = await readJson(request);
    const result = await db.fetch("https://game-db/area", {
      method: "POST",
      body: JSON.stringify({ userId: session.id, areaKey: body.areaKey }),
    });
    const data = await readJson(result);
    return json(data, result.status);
  }

  if (url.pathname === "/api/game/town" && request.method === "POST") {
    const result = await db.fetch("https://game-db/town", {
      method: "POST",
      body: JSON.stringify({ userId: session.id }),
    });
    const data = await readJson(result);
    return json(data, result.status);
  }

  if (url.pathname === "/api/game/heal" && request.method === "POST") {
    const result = await db.fetch("https://game-db/heal", {
      method: "POST",
      body: JSON.stringify({ userId: session.id }),
    });
    const data = await readJson(result);
    return json(data, result.status);
  }

  if (url.pathname === "/api/game/adventure" && request.method === "POST") {
    const result = await db.fetch("https://game-db/adventure", {
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
        area_key TEXT NOT NULL DEFAULT 'meadow',
        in_town INTEGER NOT NULL DEFAULT 0,
        hp INTEGER NOT NULL DEFAULT 30,
        max_hp INTEGER NOT NULL DEFAULT 30,
        attack_bonus INTEGER NOT NULL DEFAULT 0,
        shield INTEGER NOT NULL DEFAULT 0,
        current_monster_key TEXT NOT NULL DEFAULT 'dew_maru',
        monster_hp INTEGER NOT NULL DEFAULT 18,
        coins INTEGER NOT NULL DEFAULT 0,
        exp INTEGER NOT NULL DEFAULT 0,
        total_turns INTEGER NOT NULL DEFAULT 0,
        upgrades INTEGER NOT NULL DEFAULT 0,
        level INTEGER NOT NULL DEFAULT 1,
        skills_json TEXT NOT NULL DEFAULT '[]',
        pending_skill_json TEXT,
        battle_log TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
    this.ensureColumn("users", "job_class", "TEXT NOT NULL DEFAULT 'swordsman'");
    for (const [column, definition] of [
      ["job_class", "TEXT NOT NULL DEFAULT 'swordsman'"],
      ["area_key", "TEXT NOT NULL DEFAULT 'meadow'"],
      ["in_town", "INTEGER NOT NULL DEFAULT 0"],
      ["hp", "INTEGER NOT NULL DEFAULT 30"],
      ["max_hp", "INTEGER NOT NULL DEFAULT 30"],
      ["attack_bonus", "INTEGER NOT NULL DEFAULT 0"],
      ["shield", "INTEGER NOT NULL DEFAULT 0"],
      ["current_monster_key", "TEXT NOT NULL DEFAULT 'dew_maru'"],
      ["monster_hp", "INTEGER NOT NULL DEFAULT 18"],
      ["exp", "INTEGER NOT NULL DEFAULT 0"],
      ["total_turns", "INTEGER NOT NULL DEFAULT 0"],
      ["skills_json", "TEXT NOT NULL DEFAULT '[]'"],
      ["pending_skill_json", "TEXT"],
      ["battle_log", "TEXT NOT NULL DEFAULT ''"],
    ]) {
      this.ensureColumn("game_states", column, definition);
    }
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
        body.username, jobClass, body.passwordHash, body.passwordSalt, now
      );
      const user = this.first("SELECT id, username, job_class AS jobClass FROM users WHERE username = ?", body.username);
      const seedMonster = getMonsterForArea("meadow", 0);
      const starterSkills = getStarterSkills(jobClass);
      const job = JOBS[jobClass];
      this.sql.exec(
        `INSERT INTO game_states
         (user_id, job_class, area_key, in_town, hp, max_hp, attack_bonus, shield, current_monster_key, monster_hp, coins, exp, total_turns, upgrades, level, skills_json, pending_skill_json, battle_log, updated_at)
         VALUES (?, ?, ?, 0, ?, ?, 0, 0, ?, ?, 0, 0, 0, 0, 1, ?, NULL, ?, ?)`,
        user.id,
        jobClass,
        "meadow",
        job.maxHp,
        job.maxHp,
        seedMonster.key,
        seedMonster.maxHp,
        JSON.stringify(starterSkills),
        `${job.label}로 모험을 시작했습니다.`,
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

    if (url.pathname === "/use-skill" && request.method === "POST") {
      const body = await readJson(request);
      const state = this.getState(Number(body.userId));
      if (!state) return json({ error: "저장된 유저 데이터를 찾지 못했습니다." }, 404);
      if (state.inTown) return json({ error: "마을에 있습니다. 출발 후 전투를 진행해 주세요." }, 400);
      const skill = state.skills.find((entry) => entry.id === body.skillId);
      if (!skill) return json({ error: "장착 중인 스킬만 사용할 수 있습니다." }, 400);

      let log = [];
      let next = {
        ...state,
        totalTurns: state.totalTurns + 1,
        shield: 0,
      };

      const heroAttack = JOBS[state.jobClass].baseAttack + state.attackBonus + state.upgrades;
      const previousShield = state.shield;

      if (skill.type === "attack") {
        const damage = Math.max(1, Math.round(heroAttack * skill.power));
        next.monsterHp = Math.max(0, state.monsterHp - damage);
        log.push(`${skill.name}! ${state.currentMonster.name}에게 ${damage} 피해.`);
      }

      if (skill.type === "guard") {
        next.shield = skill.shield;
        log.push(`${skill.name}! 다음 공격을 ${skill.shield}만큼 막을 준비를 합니다.`);
      }

      if (skill.type === "heal") {
        next.hp = Math.min(state.maxHp, state.hp + skill.heal);
        log.push(`${skill.name}! 체력을 ${skill.heal} 회복했습니다.`);
      }

      if (skill.type === "buff") {
        next.attackBonus = Math.min(12, state.attackBonus + skill.attackBuff);
        log.push(`${skill.name}! 공격력이 ${skill.attackBuff} 상승했습니다.`);
        if (skill.heal) {
          next.hp = Math.min(state.maxHp, next.hp + skill.heal);
          log.push(`추가로 체력을 ${skill.heal} 회복했습니다.`);
        }
        if (skill.shield) {
          next.shield = skill.shield;
          log.push(`방어막 ${skill.shield}도 함께 얻었습니다.`);
        }
      }

      let defeated = false;
      if (next.monsterHp <= 0) {
        defeated = true;
        next.coins += state.currentMonster.reward;
        next.exp += state.currentMonster.exp;
        const nextLevel = calcLevel(next.exp);
        next.level = nextLevel;
        log.push(`${state.currentMonster.name} 처치! 제니 ${state.currentMonster.reward}, 경험치 ${state.currentMonster.exp} 획득.`);
        const learned = getLearnedSkill(state.jobClass, state.level, next.level, next.skills);
        if (learned) {
          if (next.skills.length < 4) {
            next.skills = [...next.skills, learned];
            log.push(`새 스킬 ${learned.name}을(를) 배웠습니다.`);
          } else {
            next.pendingSkill = learned;
            log.push(`새 스킬 ${learned.name}을(를) 배울 수 있습니다. 기존 스킬 하나를 교체해 주세요.`);
          }
        }
        const nextMonster = getMonsterForArea(next.areaKey, next.totalTurns + next.level + next.upgrades);
        next.currentMonsterKey = nextMonster.key;
        next.monsterHp = nextMonster.maxHp;
      } else {
        const incoming = Math.max(1, state.currentMonster.attack + Math.floor(state.level / 3));
        const reduced = Math.max(0, incoming - Math.max(previousShield, next.shield));
        next.hp = Math.max(0, next.hp - reduced);
        log.push(`${state.currentMonster.name}의 반격! ${reduced} 피해.`);
        if (next.hp <= 0) {
          next.inTown = true;
          next.hp = 0;
          next.battleLog = "전투 불능! 마을로 후퇴했습니다.";
          this.persistState(state.userId, next);
          return json({
            defeated,
            playerDefeated: true,
            state: this.getState(state.userId),
            message: "전투 불능! 마을에서 회복 후 다시 출발하세요.",
          });
        }
      }

      next.battleLog = log.join(" ");
      this.persistState(state.userId, next);
      return json({ defeated, playerDefeated: false, state: this.getState(state.userId), message: next.battleLog });
    }

    if (url.pathname === "/replace-skill" && request.method === "POST") {
      const body = await readJson(request);
      const state = this.getState(Number(body.userId));
      if (!state) return json({ error: "저장된 유저 데이터를 찾지 못했습니다." }, 404);
      if (!state.pendingSkill) return json({ error: "교체할 새 스킬이 없습니다." }, 400);
      if (!state.skills.some((entry) => entry.id === body.replaceSkillId)) {
        return json({ error: "현재 장착한 스킬만 교체할 수 있습니다." }, 400);
      }
      const skills = state.skills.map((entry) => entry.id === body.replaceSkillId ? state.pendingSkill : entry);
      const next = { ...state, skills, pendingSkill: null, battleLog: `${body.replaceSkillId} 대신 ${state.pendingSkill.name}을(를) 배웠습니다.` };
      this.persistState(state.userId, next);
      return json({ state: this.getState(state.userId) });
    }

    if (url.pathname === "/upgrade" && request.method === "POST") {
      const body = await readJson(request);
      const state = this.getState(Number(body.userId));
      if (!state) return json({ error: "저장된 유저 데이터를 찾지 못했습니다." }, 404);
      const cost = getUpgradeCost(state.upgrades);
      if (state.coins < cost) return json({ error: `제니가 부족합니다. 현재 비용은 ${cost}입니다.` }, 400);
      const next = { ...state, coins: state.coins - cost, upgrades: state.upgrades + 1, battleLog: "장비를 정비해 공격력이 조금 상승했습니다." };
      this.persistState(state.userId, next);
      return json({ state: this.getState(state.userId) });
    }

    if (url.pathname === "/area" && request.method === "POST") {
      const body = await readJson(request);
      const state = this.getState(Number(body.userId));
      if (!state) return json({ error: "저장된 유저 데이터를 찾지 못했습니다." }, 404);
      const areaKey = normalizeAreaKey(body.areaKey);
      if (state.level < AREAS[areaKey].minLevel) {
        return json({ error: `${AREAS[areaKey].name} 입장에는 레벨 ${AREAS[areaKey].minLevel} 이상이 필요합니다.` }, 400);
      }
      const nextMonster = getMonsterForArea(areaKey, state.totalTurns + state.level);
      const next = { ...state, areaKey, currentMonsterKey: nextMonster.key, monsterHp: nextMonster.maxHp, battleLog: `${AREAS[areaKey].name}(으)로 이동했습니다.` };
      this.persistState(state.userId, next);
      return json({ state: this.getState(state.userId) });
    }

    if (url.pathname === "/town" && request.method === "POST") {
      const body = await readJson(request);
      const state = this.getState(Number(body.userId));
      if (!state) return json({ error: "저장된 유저 데이터를 찾지 못했습니다." }, 404);
      const next = { ...state, inTown: true, battleLog: "마을로 돌아왔습니다." };
      this.persistState(state.userId, next);
      return json({ state: this.getState(state.userId) });
    }

    if (url.pathname === "/heal" && request.method === "POST") {
      const body = await readJson(request);
      const state = this.getState(Number(body.userId));
      if (!state) return json({ error: "저장된 유저 데이터를 찾지 못했습니다." }, 404);
      if (!state.inTown) return json({ error: "마을에서만 휴식을 취할 수 있습니다." }, 400);
      const healCost = Math.max(0, Math.floor((state.maxHp - state.hp) / 3));
      if (state.coins < healCost) return json({ error: `회복 비용 ${healCost} 제니가 필요합니다.` }, 400);
      const next = { ...state, coins: state.coins - healCost, hp: state.maxHp, shield: 0, attackBonus: 0, battleLog: `여관에서 휴식했습니다. 체력이 모두 회복되었습니다.${healCost ? ` (${healCost} 제니 사용)` : ""}` };
      this.persistState(state.userId, next);
      return json({ state: this.getState(state.userId) });
    }

    if (url.pathname === "/adventure" && request.method === "POST") {
      const body = await readJson(request);
      const state = this.getState(Number(body.userId));
      if (!state) return json({ error: "저장된 유저 데이터를 찾지 못했습니다." }, 404);
      if (state.hp <= 0) return json({ error: "체력이 0입니다. 마을에서 회복해 주세요." }, 400);
      const nextMonster = getMonsterForArea(state.areaKey, state.totalTurns + state.level + state.upgrades);
      const next = { ...state, inTown: false, shield: 0, attackBonus: 0, currentMonsterKey: nextMonster.key, monsterHp: nextMonster.maxHp, battleLog: `${AREAS[state.areaKey].name}에서 ${nextMonster.name}을(를) 만났습니다.` };
      this.persistState(state.userId, next);
      return json({ state: this.getState(state.userId) });
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
    return [...this.sql.exec(query, ...params)][0] || null;
  }

  getState(userId) {
    const row = this.first(
      `SELECT user_id AS userId, job_class AS jobClass, area_key AS areaKey, in_town AS inTown, hp, max_hp AS maxHp,
              attack_bonus AS attackBonus, shield, current_monster_key AS currentMonsterKey, monster_hp AS monsterHp,
              coins, exp, total_turns AS totalTurns, upgrades, level, skills_json AS skillsJson,
              pending_skill_json AS pendingSkillJson, battle_log AS battleLog
       FROM game_states WHERE user_id = ?`,
      userId
    );
    if (!row) return null;
    const area = AREAS[row.areaKey] || AREAS.meadow;
    const monster = MONSTERS[row.currentMonsterKey] || MONSTERS.dew_maru;
    return {
      ...row,
      inTown: Boolean(row.inTown),
      skills: safeJson(row.skillsJson, []),
      pendingSkill: safeJson(row.pendingSkillJson, null),
      area,
      areas: Object.values(AREAS).map((entry) => ({ ...entry, unlocked: row.level >= entry.minLevel })),
      currentMonster: { key: row.currentMonsterKey, ...monster },
      jobLabel: JOBS[row.jobClass]?.label || "전사",
      expToNext: expForLevel(row.level + 1),
      upgradeCost: getUpgradeCost(row.upgrades),
    };
  }

  persistState(userId, next) {
    this.sql.exec(
      `UPDATE game_states
       SET job_class = ?, area_key = ?, in_town = ?, hp = ?, max_hp = ?, attack_bonus = ?, shield = ?,
           current_monster_key = ?, monster_hp = ?, coins = ?, exp = ?, total_turns = ?, upgrades = ?, level = ?,
           skills_json = ?, pending_skill_json = ?, battle_log = ?, updated_at = ?
       WHERE user_id = ?`,
      next.jobClass,
      next.areaKey,
      next.inTown ? 1 : 0,
      next.hp,
      next.maxHp,
      next.attackBonus,
      next.shield,
      next.currentMonsterKey,
      next.monsterHp,
      next.coins,
      next.exp,
      next.totalTurns,
      next.upgrades,
      next.level,
      JSON.stringify(next.skills),
      next.pendingSkill ? JSON.stringify(next.pendingSkill) : null,
      next.battleLog || "",
      new Date().toISOString(),
      userId
    );
  }
}

function getStarterSkills(jobClass) {
  return JOB_SKILLS[jobClass].filter((skill) => !skill.learnLevel).slice(0, 2);
}

function getLearnedSkill(jobClass, oldLevel, newLevel, currentSkills) {
  const currentIds = new Set(currentSkills.map((skill) => skill.id));
  for (const skill of JOB_SKILLS[jobClass]) {
    if (!skill.learnLevel) continue;
    if (skill.learnLevel > oldLevel && skill.learnLevel <= newLevel && !currentIds.has(skill.id)) {
      return skill;
    }
  }
  return null;
}

function getMonsterForArea(areaKey, seed) {
  const area = AREAS[normalizeAreaKey(areaKey)];
  const key = area.monsters[seed % area.monsters.length];
  return { key, ...MONSTERS[key] };
}

function getUpgradeCost(upgrades) {
  return 12 + upgrades * 10;
}

function expForLevel(level) {
  return Math.max(0, (level - 1) * 20);
}

function calcLevel(exp) {
  let level = 1;
  while (exp >= expForLevel(level + 1)) level += 1;
  return level;
}

function normalizeUsername(input) {
  return String(input || "").trim().toLowerCase();
}

function normalizeJobClass(input) {
  const value = String(input || "").trim().toLowerCase();
  return JOBS[value] ? value : "swordsman";
}

function normalizeAreaKey(input) {
  const value = String(input || "").trim().toLowerCase();
  return AREAS[value] ? value : "meadow";
}

function validateCredentials(username, password) {
  if (!/^[a-z0-9_]{3,24}$/.test(username)) throw new Error("아이디는 영문 소문자, 숫자, 밑줄만 사용할 수 있고 3~24자여야 합니다.");
  if (password.length < 6) throw new Error("비밀번호는 6자 이상이어야 합니다.");
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
  try { return JSON.parse(base64UrlDecode(encoded)); } catch { return null; }
}

async function signValue(env, value) {
  const secret = env.SESSION_SECRET || FALLBACK_SECRET;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
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

function safeJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

async function readJson(requestOrResponse) {
  try { return await requestOrResponse.json(); } catch { return {}; }
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });
}
