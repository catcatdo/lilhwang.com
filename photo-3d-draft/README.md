# photo-3d-draft

사진 업로드 → 배경 제거(초안) → 각 면 치수 입력을 빠르게 검증하는 MVP 틀.

## 실행

### 방법 1) 파일 직접 열기
- `index.html` 더블클릭

### 방법 2) 로컬 서버
```bash
cd photo-3d-draft
python3 -m http.server 8787
# 브라우저: http://localhost:8787
```

## 현재 구현
- 이미지 업로드 및 원본/결과 미리보기
- 단순 이미지 분석 (해상도, 전경 추정 bbox)
- 단순 배경 제거 (밝은 배경 투명화)
- OCR 치수 자동인식 (사진의 `120x80x40mm`, `W120 H80 D40` 등 패턴 추정)
- OCR 영역 지정 (x, y, 폭x높이) 지원 — 치수 표기 부분만 인식 가능
- 원본 이미지에서 드래그로 OCR 영역 바로 지정
- OCR 전처리 3패스(원본확대/흑백강조/반전강조) 중 최적 결과 자동 선택
- 치수 후보 TOP3 제시 + 후보 클릭 즉시 W/H/D 적용
- 3D 설계용 치수 입력 (W/H/D + 6면 메모)
- 입력값 JSON 저장

## JSON -> SCAD/STL 변환 (추가됨)

`photo-3d-input.json`을 기본 3D 박스 도안으로 변환할 수 있어.

```bash
cd photo-3d-draft
python3 tools/json_to_scad.py --json /path/to/photo-3d-input.json --outdir out --name test_model
```

- 결과: `out/test_model.scad`

STL까지 바로 만들기(로컬 OpenSCAD 설치 시):

```bash
python3 tools/json_to_scad.py --json /path/to/photo-3d-input.json --outdir out --name test_model --stl
```

- 결과: `out/test_model.stl`

참고:
- 현재는 `dimensions_mm` 기반 박스 생성
- `faces.front`에 `홀 8` / `hole 8` 같은 텍스트가 있으면 정면 관통홀(직경 8mm) 자동 반영

## 다음 단계(권장)
1. 배경 제거를 AI 모델로 교체 (U2Net/SAM)
2. 전경 마스크 기반 두께 추정/윤곽 추출
3. 각 면 메모(`faces`) 파싱을 확장해 슬롯/각인/라운드 자동 반영
4. 프린트 프로파일(Bambu/Prusa/Cura) 출력 템플릿 제공
