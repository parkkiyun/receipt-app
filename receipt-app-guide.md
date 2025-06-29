# 영수증 아카이브 앱 개발 가이드

## 📋 프로젝트 개요

### 앱 목적
휴대폰으로 영수증을 촬영하면 자동으로 내용을 인식하여 저장하고, 월별 보고서를 제공하는 웹앱

### 기술 스택
- **프론트엔드**: Next.js 15 + React + TypeScript
- **스타일링**: Tailwind CSS
- **백엔드**: Supabase (PostgreSQL + Storage + Auth)
- **호스팅**: Vercel
- **OCR**: Google Cloud Vision API
- **PWA**: 모바일 앱처럼 사용 가능

---

## 🎯 핵심 기능

### MVP (최소 기능 제품)
1. **이미지 입력**: 
   - 카메라로 실시간 촬영
   - 갤러리에서 기존 이미지 선택
   - 드래그 앤 드롭 업로드 (데스크톱)
2. **텍스트 인식**: OCR로 영수증 내용 추출
3. **데이터 저장**: 파싱된 정보를 데이터베이스에 저장
4. **영수증 목록**: 저장된 영수증들을 리스트로 표시
5. **기본 검색**: 날짜, 가게명으로 검색

### 확장 기능 (v2)
6. **월별 리포트**: 카테고리별 지출 분석
7. **파일 업로드**: 갤러리에서 영수증 이미지 선택
8. **카테고리 분류**: 음식, 쇼핑, 교통 등 자동 분류
9. **지출 통계**: 차트와 그래프
10. **클라우드 백업**: Google Drive 연동

---

## 🗄️ 데이터베이스 설계

### Supabase 테이블 구조

#### `receipts` 테이블
```sql
CREATE TABLE receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  image_url TEXT NOT NULL,
  store_name TEXT,
  total_amount DECIMAL(10,2),
  receipt_date DATE,
  category TEXT DEFAULT 'misc',
  raw_text TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `categories` 테이블
```sql
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#6B7280',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 스토리지 버킷
```
receipts/
  ├── {user_id}/
  │   ├── 2024/
  │   │   ├── 01/
  │   │   │   └── receipt_001.jpg
  │   │   └── 02/
  │   └── 2025/
```

---

## 🔧 프로젝트 구조

```
receipt-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # 홈페이지
│   │   ├── camera/            # 카메라 페이지
│   │   ├── receipts/          # 영수증 목록
│   │   ├── reports/           # 월별 리포트
│   │   └── api/               # API 라우트
│   ├── components/            # 재사용 컴포넌트
│   │   ├── ImageInput/        # 이미지 입력 관련
│   │   │   ├── CameraCapture.tsx
│   │   │   ├── ImageUpload.tsx
│   │   │   └── ImagePreview.tsx
│   │   ├── ReceiptCard.tsx
│   │   ├── ReportChart.tsx
│   │   └── ui/               # 기본 UI 컴포넌트
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       └── Loading.tsx
│   ├── lib/                   # 유틸리티
│   │   ├── supabase.ts
│   │   ├── ocr.ts
│   │   └── parser.ts
│   ├── types/                 # TypeScript 타입
│   └── styles/               # 글로벌 스타일
├── public/
├── package.json
└── next.config.js
```

---

## 🚀 개발 단계별 가이드

### Phase 1: 기본 세팅 (1주)
- [ ] Next.js 프로젝트 생성
- [ ] Supabase 프로젝트 설정
- [ ] 기본 라우팅 구조 생성
- [ ] Tailwind CSS 설정

### Phase 2: 이미지 입력 기능 (1-2주)
- [ ] 이미지 입력 방식 선택 UI (카메라/갤러리/드래그앤드롭)
- [ ] 카메라 API 구현 및 실시간 촬영
- [ ] 파일 선택기 구현 (갤러리/파일 시스템)
- [ ] 드래그 앤 드롭 업로드 (데스크톱)
- [ ] 이미지 미리보기 및 크롭 기능
- [ ] 이미지 압축 및 최적화
- [ ] Supabase Storage 연동
- [ ] 업로드 진행률 표시

### Phase 3: OCR 연동 (1-2주)
- [ ] Google Cloud Vision API 설정
- [ ] OCR 처리 API 라우트 생성
- [ ] 영수증 텍스트 파싱 로직
- [ ] 에러 처리 및 재시도

### Phase 4: 데이터 관리 (1주)
- [ ] 영수증 저장 기능
- [ ] 목록 조회 페이지
- [ ] 수정/삭제 기능
- [ ] 검색 기능

### Phase 5: 리포트 기능 (1주)
- [ ] 월별 집계 쿼리
- [ ] 차트 라이브러리 연동
- [ ] 카테고리별 분석
- [ ] PDF 내보내기

### Phase 6: PWA 최적화 (3일)
- [ ] 매니페스트 파일 생성
- [ ] 서비스 워커 설정
- [ ] 오프라인 지원
- [ ] 홈 화면 추가 유도

---

## 🔧 환경 설정

### 필요한 API 키
1. **Supabase**: 무료 계정 생성
   - Project URL
   - Anon Key

2. **Google Cloud Vision**: 무료 크레딧 사용
   - API Key 또는 Service Account Key

3. **Vercel**: GitHub 연동으로 배포

### 환경 변수 (.env.local)
```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Cloud Vision API
GOOGLE_CLOUD_VISION_API_KEY=your_vision_api_key

# 선택사항: 이미지 압축 서비스
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_name

# 개발환경 설정
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 📱 UI/UX 설계

### 주요 페이지
1. **홈 (/)**: 최근 영수증, 이번 달 총액, 빠른 액션 버튼
2. **이미지 입력 (/add)**: 
   - 탭 기반 UI (카메라/갤러리/업로드)
   - 실시간 카메라 프리뷰
   - 파일 드래그앤드롭 영역
   - 이미지 크롭 및 회전 도구
3. **영수증 목록 (/receipts)**: 무한 스크롤, 필터, 검색
4. **상세 페이지 (/receipts/[id])**: 이미지, 추출 정보, 수정
5. **리포트 (/reports)**: 월별 차트, 카테고리 분석

### 모바일 우선 설계
- 터치 친화적 버튼 크기 (최소 44px)
- 스와이프 제스처 지원
- 하단 탭 네비게이션
- 다크 모드 지원

---

## 🧠 AI 개발 프롬프트 가이드

### 프로젝트 초기 설정
```
"Next.js 15 + TypeScript + Tailwind CSS로 영수증 스캔 앱 프로젝트를 생성해줘. 
App Router 사용하고, Supabase 연동을 위한 기본 설정도 포함해줘."
```

### 이미지 입력 기능 구현
```
"React 카메라 API와 파일 업로드를 모두 지원하는 이미지 입력 컴포넌트를 만들어줘.
- 탭으로 카메라/갤러리 선택
- 카메라: 실시간 프리뷰와 촬영 기능
- 갤러리: 파일 선택기와 드래그앤드롭
- 이미지 미리보기와 크롭 기능
- Supabase Storage 업로드 포함"
```

### OCR 처리
```
"Google Cloud Vision API를 사용해서 영수증 이미지에서 텍스트를 추출하고, 
가게명, 금액, 날짜를 파싱하는 Next.js API 라우트를 만들어줘."
```

---

## 📐 상세 기술 스펙

### 이미지 처리 요구사항
- **지원 포맷**: JPEG, PNG, WebP
- **최대 파일 크기**: 10MB
- **권장 해상도**: 1080p 이상
- **압축 비율**: 80% 품질로 자동 압축
- **크롭 비율**: 자유 형태 또는 A4 비율

### OCR 처리 최적화
- **전처리**: 이미지 회전 보정, 노이즈 제거
- **언어 설정**: 한국어(ko) + 영어(en) 동시 인식
- **신뢰도 임계값**: 60% 이상만 채택
- **재시도 로직**: 실패시 3회까지 자동 재시도

### 데이터베이스 인덱싱
```sql
-- 성능 최적화를 위한 인덱스
CREATE INDEX idx_receipts_user_date ON receipts(user_id, receipt_date DESC);
CREATE INDEX idx_receipts_store_name ON receipts(store_name);
CREATE INDEX idx_receipts_category ON receipts(category);
CREATE INDEX idx_receipts_amount ON receipts(total_amount);
```

---

## 🚨 에러 처리 가이드

### 카메라 접근 에러
```typescript
// 카메라 권한 처리 예제
const handleCameraError = (error: Error) => {
  switch (error.name) {
    case 'NotAllowedError':
      // 권한 거부: 수동 설정 가이드 제공
      showPermissionGuide();
      break;
    case 'NotFoundError':
      // 하드웨어 없음: 파일 업로드만 제공
      switchToFileUpload();
      break;
    case 'NotSupportedError':
      // iOS Safari 제한: 대체 방법 안내
      showSafariGuide();
      break;
    default:
      showGenericError();
  }
};
```

### OCR 처리 실패
- **이미지 품질 낮음**: 재촬영 유도 메시지
- **텍스트 없음**: 수동 입력 옵션 제공  
- **API 한도 초과**: 사용자에게 알림 및 대기 안내
- **네트워크 에러**: 로컬 저장 후 재시도

### 네트워크 에러 처리
```typescript
// 오프라인 대응 전략
const handleOfflineUpload = async (imageData: File) => {
  if (!navigator.onLine) {
    // 로컬 저장 (IndexedDB)
    await saveToLocal(imageData);
    showOfflineMessage();
    return;
  }
  
  try {
    await uploadToSupabase(imageData);
  } catch (error) {
    // 실패시 재시도 큐에 추가
    addToRetryQueue(imageData);
  }
};
```

---

## ⚡ 성능 최적화

### 이미지 최적화 전략
```typescript
// 이미지 압축 설정
const compressImage = (file: File): Promise<File> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // 최대 1920x1080으로 리사이즈
      const maxWidth = 1920;
      const maxHeight = 1080;
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    };
    img.src = URL.createObjectURL(file);
  });
};
```

### 데이터 로딩 최적화
- **무한 스크롤**: 페이지당 20개 항목
- **이미지 레이지 로딩**: Intersection Observer 사용
- **캐싱 전략**: SWR로 데이터 캐싱
- **압축 응답**: gzip 압축 적용
- **썸네일 생성**: 300x300 크기로 자동 생성

### Next.js 성능 설정
```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['your-supabase-url.supabase.co'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
};
```

---

## 🔒 보안 설계

### 데이터 보호
```sql
-- Row Level Security 설정
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see own receipts" ON receipts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert own receipts" ON receipts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 이미지 보안
```typescript
// 서명된 URL 생성 (1시간 유효)
const getSignedUrl = async (imagePath: string) => {
  const { data } = await supabase.storage
    .from('receipts')
    .createSignedUrl(imagePath, 3600);
  return data?.signedUrl;
};
```

### 개인정보 보호
```typescript
// 민감 정보 마스킹
const maskSensitiveInfo = (text: string) => {
  // 카드번호 마스킹 (1234-****-****-5678)
  text = text.replace(/(\d{4})-?\d{4}-?\d{4}-?(\d{4})/g, '$1-****-****-$2');
  
  // 전화번호 마스킹 (010-****-1234)
  text = text.replace(/(\d{3})-?\d{4}-?(\d{4})/g, '$1-****-$2');
  
  return text;
};
```

### 사용자 인증
- **세션 타임아웃**: 7일 자동 로그아웃
- **토큰 기반 인증**: JWT 사용
- **로그아웃시 클리어**: 로컬 캐시 완전 삭제

---

## 📊 배포 및 운영

### Vercel 배포 설정
```json
// vercel.json
{
  "functions": {
    "app/api/ocr/route.ts": {
      "maxDuration": 30
    },
    "app/api/upload/route.ts": {
      "maxDuration": 15
    }
  },
  "crons": [
    {
      "path": "/api/cleanup",
      "schedule": "0 2 * * *"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=0"
        }
      ]
    }
  ]
}
```

### 환경별 설정
```bash
# .env.production
NEXT_PUBLIC_SUPABASE_URL=your_production_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# .env.development  
NEXT_PUBLIC_SUPABASE_URL=your_dev_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 모니터링 설정
```typescript
// lib/analytics.ts
import { Analytics } from '@vercel/analytics/react';

// 에러 추적 (Sentry)
import * as Sentry from '@sentry/nextjs';

export const trackEvent = (event: string, data?: any) => {
  // Vercel Analytics
  Analytics.track(event, data);
  
  // 커스텀 로깅
  console.log(`Event: ${event}`, data);
};

export const trackError = (error: Error, context?: any) => {
  Sentry.captureException(error, { extra: context });
};
```

### 사용량 모니터링
- **Vercel Analytics**: 페이지뷰, 성능 메트릭
- **Supabase Dashboard**: DB 사용량, API 호출수
- **Google Cloud Console**: Vision API 호출량
- **Custom Metrics**: OCR 성공률, 에러율

---

## 🔍 테스트 계획

### 기능 테스트
- [ ] 다양한 영수증 형태 테스트
- [ ] 이미지 품질별 OCR 정확도 확인
- [ ] 모바일 브라우저 호환성 테스트
- [ ] PWA 설치 및 오프라인 기능 테스트

### 성능 테스트
- [ ] 이미지 업로드 속도
- [ ] OCR 처리 시간
- [ ] 목록 로딩 성능
- [ ] 모바일 배터리 사용량

---

## 🧪 테스트 시나리오

### 영수증 타입별 테스트
- [ ] **편의점 영수증**: GS25, 세븐일레븐, CU, 미니스톱
- [ ] **카페 영수증**: 스타벅스, 이디야, 할리스, 카페베네
- [ ] **마트 영수증**: 이마트, 롯데마트, 홈플러스, 코스트코
- [ ] **음식점 영수증**: 맥도날드, KFC, 버거킹, 지역 음식점
- [ ] **온라인 쇼핑**: 쿠팡, 11번가, G마켓, 옥션
- [ ] **수기 영수증**: 손글씨, 영수증 용지
- [ ] **외국어 혼재**: 영어 브랜드명 포함
- [ ] **특수 형태**: 긴 영수증, 접힌 영수증

### 디바이스별 테스트
```markdown
**모바일 테스트**
- [ ] iPhone 12/13/14/15 (Safari)
- [ ] iPhone SE (작은 화면)
- [ ] Samsung Galaxy S20/S21/S22
- [ ] LG, Xiaomi 안드로이드 폰
- [ ] iPad (세로/가로 모드)
- [ ] 안드로이드 태블릿

**데스크톱 테스트**
- [ ] macOS Chrome/Safari
- [ ] Windows Chrome/Edge
- [ ] Linux Chrome/Firefox
- [ ] 다양한 해상도 (1080p, 1440p, 4K)
```

### 성능 테스트
```markdown
**로딩 성능**
- [ ] 이미지 업로드 속도 (Wi-Fi/4G/5G)
- [ ] OCR 처리 시간 (평균 3초 이내)
- [ ] 목록 로딩 (500개 영수증)
- [ ] 검색 응답 시간 (1초 이내)

**배터리 사용량**
- [ ] 연속 촬영 10회
- [ ] 1시간 사용시 배터리 소모
- [ ] 백그라운드 동작 테스트
```

### 기능 테스트
```markdown
**OCR 정확도**
- [ ] 가게명 인식률 (목표: 90%)
- [ ] 금액 인식률 (목표: 95%)
- [ ] 날짜 인식률 (목표: 85%)
- [ ] 전체 텍스트 추출 품질

**에러 처리**
- [ ] 네트워크 끊김 상황
- [ ] 카메라 접근 거부
- [ ] 파일 크기 초과
- [ ] OCR API 에러
- [ ] 저장소 용량 부족
```

---

## 👥 사용자 UX 가이드

### 온보딩 플로우
```markdown
**1단계: 앱 소개 (3개 슬라이드)**
- 슬라이드 1: "영수증을 찍기만 하세요"
- 슬라이드 2: "자동으로 정리해드려요"  
- 슬라이드 3: "월별 리포트로 확인하세요"

**2단계: 권한 요청**
- 카메라 권한 설명 및 요청
- 알림 권한 (선택사항)

**3단계: 첫 영수증 가이드**
- 촬영 팁 오버레이 표시
- 실제 영수증으로 테스트
- 결과 확인 및 수정 방법

**4단계: PWA 설치 유도**
- 홈 화면 추가 가이드
- 오프라인 사용 가능 안내
```

### 촬영 가이드 시스템
```typescript
// 촬영 팁 컴포넌트
const CameraTips = () => {
  const tips = [
    "영수증을 평평하게 펼쳐주세요",
    "충분한 조명에서 촬영해주세요", 
    "영수증이 화면에 꽉 차도록 해주세요",
    "흔들리지 않게 고정해주세요"
  ];
  
  return (
    <div className="tips-overlay">
      {tips.map((tip, index) => (
        <div key={index} className="tip-item">
          {tip}
        </div>
      ))}
    </div>
  );
};
```

### 도움말 시스템
```markdown
**인식이 안될 때**
- 이미지를 더 밝게 촬영
- 영수증을 평평하게 펼치기
- 카메라와의 거리 조절
- 수동 입력 옵션 제공

**데이터 관리**
- 영수증 정보 수정 방법
- 카테고리 변경 방법
- 영수증 삭제 및 복구
- 데이터 백업 및 복원

**내보내기 기능**
- CSV 파일로 내보내기
- PDF 리포트 생성
- 이메일로 전송
- 구글 시트 연동
```

### 접근성 개선
```typescript
// 접근성 설정
const AccessibilityFeatures = {
  // 화면 읽기 도구 지원
  ariaLabels: true,
  
  // 고대비 모드
  highContrast: true,
  
  // 큰 텍스트 지원
  largeText: true,
  
  // 키보드 내비게이션
  keyboardNavigation: true,
  
  // 음성 피드백
  voiceAnnouncements: true
};
```

---

## 🔄 CI/CD 파이프라인

### GitHub Actions 설정
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build project
        run: npm run build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### 품질 관리
```json
// package.json scripts
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:e2e": "playwright test",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "analyze": "cross-env ANALYZE=true next build"
  }
}
```

---

## 📈 향후 확장 계획

### 고급 기능
- 음성 메모 추가
- 영수증 공유 기능
- 가족/팀 계정 지원
- 자동 영수증 분류 (AI 학습)
- 영수증 진위 확인

### 연동 서비스
- 가계부 앱 연동
- 세무 소프트웨어 연동
- 쇼핑몰 영수증 자동 수집
- 신용카드 내역 연동

---

## 📈 향후 로드맵

### v1.0 (MVP) - 기본 기능
- [x] 영수증 촬영/업로드
- [x] OCR 텍스트 추출
- [x] 기본 데이터 저장
- [x] 영수증 목록 조회

### v1.1 - 개선사항
- [ ] 월별 리포트 기능
- [ ] 카테고리 자동 분류
- [ ] 검색 및 필터 강화
- [ ] PWA 최적화

### v1.2 - 고급 기능
- [ ] 영수증 공유 기능
- [ ] 음성 메모 추가
- [ ] 다국어 지원
- [ ] 다크 모드

### v2.0 - 확장 기능
- [ ] AI 기반 지출 분석
- [ ] 가족/팀 계정 지원
- [ ] 외부 서비스 연동
- [ ] 실시간 알림

---

## 🚨 주의사항

### 개발시 고려사항
1. **프라이버시**: 영수증 이미지는 민감 정보 포함
2. **보안**: Row Level Security 설정 필수
3. **성능**: 이미지 압축 및 최적화 필요
4. **비용**: API 호출량 모니터링 필요

### 제한사항
1. **Supabase 무료 플랜**: 500MB DB, 1GB Storage
2. **Google Vision API**: 월 1000회 무료
3. **모바일 브라우저**: 카메라 권한 필요

---

## 📚 참고 자료

- [Next.js 공식 문서](https://nextjs.org/docs)
- [Supabase 가이드](https://supabase.com/docs)
- [Google Cloud Vision API](https://cloud.google.com/vision/docs)
- [PWA 개발 가이드](https://web.dev/progressive-web-apps/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

*이 가이드는 개발 진행에 따라 지속적으로 업데이트됩니다.*