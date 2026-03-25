# lilhwang.com

로그인 후 진행도가 저장되는 Cloudflare Worker 기반 웹게임입니다.

## 구조

- `public/index.html`: 로그인 화면 + 게임 UI
- `src/worker.js`: 인증, 세션, 게임 API
- `GameDatabase` Durable Object: 유저 계정과 게임 진행도 저장

## 현재 게임

- 회원가입 / 로그인
- 세션 쿠키 유지
- 클릭으로 포인트 획득
- 업그레이드 구매
- 유저별 데이터 저장

## 로컬 실행

```bash
npx wrangler@4 dev
```

## 배포 전 체크

- `wrangler.jsonc`의 `SESSION_SECRET`은 실제 비밀값으로 바꾸는 것을 권장합니다.
- `main` 브랜치에 푸시하면 GitHub Actions를 통해 Cloudflare Worker로 배포됩니다.
