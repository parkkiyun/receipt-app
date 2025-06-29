# Receipt App - Claude Development Guide

## 프로젝트 개요
영수증 관리 Next.js 웹 애플리케이션

## 기술 스택
- **프레임워크**: Next.js 15.3.4 (App Router)
- **언어**: TypeScript
- **인증/DB**: Supabase
- **스타일링**: Tailwind CSS
- **이미지 처리**: browser-image-compression
- **OCR**: Google Vision API / Naver Clova OCR

## 프로젝트 구조
```
src/
├── app/                    # Next.js App Router 페이지
│   ├── add/               # 영수증 추가 페이지
│   ├── api/               # API 라우트
│   │   └── ocr/          # OCR 처리 API
│   ├── login/            # 로그인 페이지
│   └── receipts/         # 영수증 목록/상세 페이지
├── components/            # React 컴포넌트
│   ├── ImageInput/       # 이미지 입력 컴포넌트
│   └── ui/               # UI 컴포넌트
├── lib/                   # 유틸리티 함수
│   ├── api/              # API 관련 함수
│   │   ├── client-receipts.ts  # 클라이언트용 영수증 API
│   │   ├── receipts.ts         # 서버용 영수증 API
│   │   ├── server-auth.ts      # 서버 인증
│   │   └── storage.ts          # 파일 스토리지
│   └── supabase/         # Supabase 클라이언트
│       ├── client.ts     # 브라우저 클라이언트
│       └── server.ts     # 서버 클라이언트
└── types/                # TypeScript 타입 정의
```

## 주요 명령어
```bash
npm run dev    # 개발 서버 실행 (--turbopack)
npm run build  # 프로덕션 빌드
npm run start  # 프로덕션 서버 실행
npm run lint   # ESLint 실행
npx tsc --noEmit  # TypeScript 타입 체크
```

## 환경 변수
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 익명 키
- `GOOGLE_CLOUD_VISION_API_KEY`: Google Vision API 키 (서버 사이드 전용)
- `CLOVA_OCR_API_URL`: Naver Clova OCR API URL (서버 사이드 전용)
- `CLOVA_OCR_API_KEY`: Naver Clova OCR API 키 (서버 사이드 전용)

## 주의사항

### 1. 서버/클라이언트 컴포넌트 구분
- **서버 컴포넌트**: `createSupabaseServerClient()` 사용 (async 함수)
- **클라이언트 컴포넌트**: `createClient()` 사용
- 클라이언트 컴포넌트에서는 서버 전용 API 사용 불가

### 2. Supabase 클라이언트 생성
```typescript
// 서버 컴포넌트/API 라우트
const supabase = await createSupabaseServerClient()

// 클라이언트 컴포넌트
const supabase = createClient()
```

### 3. 이미지 업로드
- Supabase Storage 사용
- 업로드 전 이미지 압축 처리
- Signed URL로 이미지 접근

### 4. OCR 처리
- Google Vision API 또는 Naver Clova OCR 사용
- 서버 사이드에서만 처리 (API 키 보호)
- 한국어/영어 텍스트 인식 지원

## 개발 시 확인사항
1. TypeScript 타입 체크: `npx tsc --noEmit`
2. ESLint 확인: `npm run lint`
3. 빌드 확인: `npm run build`
4. 환경 변수 설정 확인