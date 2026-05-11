# HairLog

유빈 디자이너용 모바일 매출 관리 웹앱입니다.  
URL로 바로 접속해서 사용하고, 데이터는 Google Sheets에 저장합니다.

## 미리보기

<img src="docs/screenshots/demo.gif" alt="사용 흐름" width="320" />

| 리포트 | 홈                                  | 입력                                |
|---|------------------------------------|-----------------------------------|
| <img src="docs/screenshots/demo.gif" alt="사용 흐름" />    | ![홈 화면](docs/screenshots/home.png) | ![입력 화면](docs/screenshots/input.png) |

| 현황                                     | 설정 | 휴무 |
|----------------------------------------|---|---|
| ![리포트 화면](docs/screenshots/report.png) | ![설정 화면](docs/screenshots/settings.png) | ![휴무 화면](docs/screenshots/closed-days.png) |

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

## Google Sheets 구조

하나의 Spreadsheet 안에서 아래 3개 시트를 사용합니다.

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
| `type` | `extra`, `remove` |
| `memo` | 메모 |

## 환경변수

`.env.local`

```env
GOOGLE_CLIENT_EMAIL=service-account@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
GOOGLE_SHEET_ID=your_google_sheet_id
```

참고:

- `GOOGLE_PRIVATE_KEY`는 코드에서 `replace(/\\n/g, "\n")` 처리합니다.
- `GOOGLE_SHEET_ID`는 전체 URL이 아니라 시트 ID만 넣습니다.
- 서비스 계정 이메일을 해당 시트에 편집자로 공유해야 합니다.

## 실행

```bash
npm install
npm run dev
```

빌드 확인:

```bash
npm run build
```

## 배포

Vercel 기준입니다.

1. GitHub에 코드 푸시
2. Vercel에서 프로젝트 import
3. 아래 환경변수 등록
4. 서비스 계정 이메일을 Google Sheets에 공유
5. Redeploy

필수 환경변수:

- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SHEET_ID`

## API

- `GET /api/sales?month=YYYY-MM`
- `POST /api/sales`
- `GET /api/goals?month=YYYY-MM`
- `POST /api/goals`
- `GET /api/closed-days?month=YYYY-MM`
- `POST /api/closed-days`

## 참고

- 화요일은 저장하지 않아도 기본 휴무로 계산됩니다.
- 같은 날짜 매출은 중복 추가가 아니라 수정 기준으로 처리됩니다.
- 현재 월 리포트 그래프는 오늘 날짜까지만 표시됩니다.
- Google Sheets API 쿼터를 줄이기 위해 읽기 캐시를 사용합니다.
