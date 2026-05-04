# HairLog

디자이너를 위한 개인용 매출 관리 모바일 웹앱입니다.  
앱스토어 배포 없이 URL로 접속해 사용할 수 있고, 데이터는 Google Sheets를 저장소로 사용합니다.

## 프로젝트 개요

- 프로젝트 이름: `디자이너 목표 달성`
- 배포 대상: Vercel
- UI 기준: 모바일 웹 우선
- 저장소: Google Sheets
- 인증 방식: Google Service Account

## 주요 기능

- 월 목표 매출 설정
- 일 매출 입력 및 날짜별 수정
- 기본 휴무일(매주 화요일) 자동 반영
- 추가 휴무일 직접 체크
- 월간 대시보드
- 월간 / 연간 리포트
- 날짜 기준 중복 저장 방지
- Google Sheets 기반 API 저장

## 기술 스택

- Frontend
  - React 18
  - TypeScript
  - Vite
  - Tailwind CSS
  - Recharts
- Backend
  - Vercel Serverless Functions
  - googleapis
- Data
  - Google Sheets

## 화면 구성

- 홈
  - 이번 달 목표
  - 이번 달 누적 매출
  - 달성률
  - 오늘 목표 / 오늘 매출 / 차이
  - 최근 입력 내역
- 입력
  - 날짜별 매출 입력
  - 메모 저장
- 휴무
  - 화요일 자동 휴무
  - 추가 휴무일 선택
- 리포트
  - 월간 막대 그래프
  - 월 누적 그래프
  - 연간 월별 리포트
- 설정
  - 월 목표 매출 설정

## 스크린샷

현재 README에는 실제 이미지 파일이 포함되어 있지 않습니다.  
스크린샷을 넣고 싶다면 아래 경로를 만들어 추가하면 됩니다.

```text
docs/
  screenshots/
    home.png
    input.png
    closed-days.png
    report.png
    settings.png
    vercel-env.png
    google-sheet-share.png
```

예시:

```md
![홈 화면](docs/screenshots/home.png)
![Vercel 환경변수 설정](docs/screenshots/vercel-env.png)
```

## 폴더 구조

```text
api/
  sales.ts
  goals.ts
  closed-days.ts

src/
  components/
  pages/
    HomePage.tsx
    SalesInputPage.tsx
    ClosedDaysPage.tsx
    ReportPage.tsx
    SettingsPage.tsx
  server/
    handlers/
      sales.ts
      goals.ts
      closedDays.ts
    http.ts
    sheetsClient.ts
    sheetsRepository.ts
    types.ts
  types/
    sales.ts
  utils/
    api.ts
    dateUtils.ts
    salesUtils.ts
    storage.ts
  App.tsx
  main.tsx
```

## 동작 구조

```mermaid
flowchart TD
  A["모바일 웹앱 (React/Vite)"] --> B["/api/sales"]
  A --> C["/api/goals"]
  A --> D["/api/closed-days"]
  B --> E["Vercel Serverless Functions"]
  C --> E
  D --> E
  E --> F["Google Sheets API"]
  F --> G["sales 시트"]
  F --> H["goals 시트"]
  F --> I["closed_days 시트"]
```

## Google Sheets 구조

하나의 스프레드시트 안에 아래 시트 탭 3개를 사용합니다.

### 1. `sales`

| date | amount | memo |
|---|---:|---|
| 2026-05-04 | 230000 | 염색 손님 많음 |

### 2. `goals`

| month | goalAmount |
|---|---:|
| 2026-05 | 5000000 |

### 3. `closed_days`

| date | type | memo |
|---|---|---|
| 2026-05-20 | extra | 개인 일정 |

## 환경변수

`.env.example` 기준:

```env
GOOGLE_CLIENT_EMAIL=service-account@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your_google_sheet_id
```

### 주의사항

- `GOOGLE_PRIVATE_KEY`는 코드에서 `replace(/\\n/g, "\n")` 처리합니다.
- Vercel에 입력할 때는 보통 큰따옴표 없이 넣는 것을 권장합니다.
- `GOOGLE_SHEET_ID`는 전체 URL이 아니라 **시트 ID만** 입력합니다.

## 로컬 실행 방법

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경변수 파일 생성

`.env.local` 파일을 만들고 아래 값을 채웁니다.

```env
GOOGLE_CLIENT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
GOOGLE_SHEET_ID=...
```

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 빌드 확인

```bash
npm run build
```

## Vercel 배포 방법

### 1. GitHub에 푸시

```bash
git add .
git commit -m "Deploy update"
git push origin main
```

### 2. Vercel 프로젝트 연결

- [vercel.com](https://vercel.com) 로그인
- GitHub 저장소 연결
- 프로젝트 import

### 3. Environment Variables 등록

Vercel 프로젝트에서 아래 경로로 이동합니다.

- `Project`
- `Settings`
- `Environment Variables`

추가해야 할 값:

- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SHEET_ID`

권장 환경:

- `Production`
- `Preview`

### 4. 재배포

환경변수를 바꿨다면 반드시 다시 배포해야 합니다.

- `Deployments`
- 최신 배포 선택
- `Redeploy`

## Google Sheets 권한 설정

아래 순서가 매우 중요합니다.

1. Google Sheets 열기
2. 우측 상단 `공유`
3. `GOOGLE_CLIENT_EMAIL` 값의 서비스 계정 이메일 추가
4. 권한을 `편집자`로 설정

이 단계가 빠지면 API는 인증은 되어도 시트 읽기/쓰기에 실패할 수 있습니다.

## API 명세

### GET `/api/sales?month=YYYY-MM`

응답:

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

### POST `/api/sales`

요청:

```json
{
  "date": "2026-05-04",
  "amount": 230000,
  "memo": "염색 손님 많음"
}
```

### GET `/api/goals?month=YYYY-MM`

응답:

```json
{
  "item": {
    "month": "2026-05",
    "goalAmount": 5000000
  }
}
```

### POST `/api/goals`

요청:

```json
{
  "month": "2026-05",
  "goalAmount": 5000000
}
```

### GET `/api/closed-days?month=YYYY-MM`

응답:

```json
{
  "items": [
    {
      "date": "2026-05-20",
      "type": "extra",
      "memo": "개인 일정"
    }
  ]
}
```

### POST `/api/closed-days`

요청:

```json
{
  "date": "2026-05-20",
  "type": "extra",
  "memo": "개인 일정"
}
```

`type` 값:

- `extra`
- `vacation`
- `holiday`
- `remove`

## 데이터 처리 규칙

### 화요일 기본 휴무

- 매주 화요일은 저장 없이 계산 시 자동 휴무 처리됩니다.

### 추가 휴무

- `closed_days` 시트에만 저장됩니다.

### 같은 날짜 중복 방지

- `sales` / `closed_days`는 날짜 기준으로 upsert
- `goals`는 `month` 기준으로 upsert
- 중복 행이 있으면 첫 행만 남기고 나머지는 정리합니다.

### 월간 리포트 그래프

- 현재 월은 오늘 날짜까지만 표시
- 과거 월은 해당 월 전체 날짜 표시
- 미래 월은 아직 날짜를 표시하지 않음

## 캐시 / 쿼터 최적화

Google Sheets는 분당 읽기 제한이 있기 때문에 서버 쪽에서 최적화를 적용했습니다.

- 읽기 결과 30초 메모리 캐시
- 쓰기 발생 시 해당 시트 캐시만 무효화
- 조회 API는 불필요한 시트 셋업 호출을 생략

그래도 짧은 시간에 너무 많은 요청이 몰리면 Google Sheets API `429 RESOURCE_EXHAUSTED`가 날 수 있습니다.

## 트러블슈팅

### 1. `FUNCTION_INVOCATION_FAILED`

확인할 것:

- Vercel 환경변수 등록 여부
- 최근 배포가 최신 커밋 기준인지
- Functions 로그의 실제 에러 메시지

### 2. `Cannot find module '/var/task/src/server/handlers/...`

원인:

- Vercel ESM 환경에서 상대 import 확장자 문제

현재 프로젝트는 `.js` 확장자를 명시하도록 수정되어 있습니다.

### 3. `Quota exceeded for quota metric 'Read requests'`

원인:

- Google Sheets API 읽기 요청이 너무 많음

대응:

- 잠시 기다린 뒤 다시 시도
- 같은 화면 반복 새로고침 줄이기
- 캐시 최적화 반영 버전 배포 확인

### 4. `The caller does not have permission`

원인:

- 서비스 계정이 시트에 공유되지 않음

대응:

- `GOOGLE_CLIENT_EMAIL` 계정을 스프레드시트에 편집자로 추가

## 배포 체크리스트

- [ ] GitHub 최신 코드 푸시
- [ ] Vercel 환경변수 등록
- [ ] 서비스 계정 이메일 시트 공유
- [ ] Redeploy 완료
- [ ] `/api/goals?month=2026-05` 확인
- [ ] 앱에서 홈 / 입력 / 휴무 / 리포트 동작 확인

## 라이선스

개인 프로젝트 용도로 사용 중입니다.
