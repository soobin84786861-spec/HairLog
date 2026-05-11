# HairLog

디자이너용 모바일 매출 관리 웹앱입니다.  
앱스토어 배포 없이 URL로 접속해서 사용하며, 데이터는 Google Sheets에 저장합니다.

## 주요 기능

- 월 목표 매출 설정
- 일 매출 입력 및 수정
- 화요일 기본 휴무 반영
- 추가 휴무일 체크
- 월간 / 연간 리포트
- Google Sheets 연동

## 기술 스택

- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Vercel Serverless Functions
- Google Sheets API

## 데이터 저장 구조

하나의 Google Spreadsheet 안에 아래 3개 시트를 사용합니다.

### `sales`

| column | description |
|---|---|
| `date` | `YYYY-MM-DD` |
| `amount` | 매출 금액 |
| `memo` | 메모 |

### `goals`

| column | description |
|---|---|
| `month` | `YYYY-MM` |
| `goalAmount` | 월 목표 매출 |

### `closed_days`

| column | description |
|---|---|
| `date` | `YYYY-MM-DD` |
| `type` | `extra`, `remove` 등 |
| `memo` | 메모 |

## 환경변수

`.env.local`

```env
GOOGLE_CLIENT_EMAIL=service-account@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
GOOGLE_SHEET_ID=your_google_sheet_id
```

주의:

- `GOOGLE_PRIVATE_KEY`는 코드에서 `replace(/\\n/g, "\n")` 처리합니다.
- `GOOGLE_SHEET_ID`는 전체 URL이 아니라 시트 ID만 넣습니다.
- 서비스 계정 이메일을 해당 스프레드시트에 편집자로 공유해야 합니다.

## 로컬 실행

```bash
npm install
npm run dev
```

빌드 확인:

```bash
npm run build
```

## 배포

배포 대상은 Vercel입니다.

1. GitHub에 코드 푸시
2. Vercel에서 프로젝트 import
3. 환경변수 등록
4. 서비스 계정 이메일을 Google Sheets에 공유
5. Redeploy

Vercel에 등록할 환경변수:

- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SHEET_ID`

## API

### `GET /api/sales?month=YYYY-MM`

```json
{
  "items": [
    {
      "date": "2026-05-04",
      "amount": 230000,
      "memo": "염색 손님 많음"
    }
  ]
}
```

### `POST /api/sales`

```json
{
  "date": "2026-05-04",
  "amount": 230000,
  "memo": "염색 손님 많음"
}
```

### `GET /api/goals?month=YYYY-MM`

```json
{
  "item": {
    "month": "2026-05",
    "goalAmount": 5000000
  }
}
```

### `POST /api/goals`

```json
{
  "month": "2026-05",
  "goalAmount": 5000000
}
```

### `GET /api/closed-days?month=YYYY-MM`

```json
{
  "items": [
    {
      "date": "2026-05-20",
      "type": "extra",
      "memo": ""
    }
  ]
}
```

### `POST /api/closed-days`

```json
{
  "date": "2026-05-20",
  "type": "extra",
  "memo": ""
}
```

## 참고

- 화요일은 저장하지 않아도 기본 휴무로 계산됩니다.
- 같은 날짜 매출은 중복 추가가 아니라 수정 기준으로 처리됩니다.
- 현재 월 리포트 그래프는 오늘 날짜까지만 표시됩니다.
- Google Sheets API 쿼터를 줄이기 위해 읽기 캐시를 사용합니다.

## 데모 이미지 / GIF

README에 스크린샷이나 GIF도 넣을 수 있습니다.

예시:

```md
![홈 화면](docs/screenshots/home.png)
![사용 흐름](docs/screenshots/demo.gif)
```

원하면 다음 단계로 제가 바로 해드릴 수 있는 것:

- README에 들어갈 스크린샷 섹션 추가
- 앱 실행 화면 GIF 파일 연결용 마크업 추가

GIF 자체 제작은 가능합니다.  
다만 실제 화면 녹화 파일은 로컬 실행 화면을 캡처해서 만들어야 해서, 원하면 제가 그 단계까지 이어서 진행해드릴게요.
