# lilhwang.com

개인 홈페이지용 정적 사이트입니다.

## 실행

```bash
python3 -m http.server 8787
# http://localhost:8787
```

## 배포

`main` 브랜치에 푸시하면 GitHub Actions를 통해 Cloudflare Worker로 배포됩니다.
