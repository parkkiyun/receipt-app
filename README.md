# 영수증 아카이브 앱 📧📱

영수증을 스캔하고 자동으로 정리하는 웹앱입니다. 카메라로 영수증을 촬영하거나 이미지를 업로드하면 OCR로 자동 인식하여 데이터를 추출하고 관리할 수 있습니다.

## 🚀 기능

### ✅ 구현 완료
- **홈 대시보드**: 월별 통계와 최근 영수증 목록
- **이미지 입력**: 카메라 촬영 및 파일 업로드 (탭 기반 UI)
- **영수증 추가**: 단계별 가이드와 OCR 처리 (더미 데이터)
- **반응형 디자인**: 모바일 우선 디자인
- **타입 안전성**: TypeScript 완전 지원

### 🚧 개발 중
- **Supabase 실제 연동**: 데이터베이스 및 스토리지 연결
- **Google Vision API**: 실제 OCR 처리
- **영수증 목록 페이지**: 필터링 및 검색
- **영수증 상세 페이지**: 편집 및 삭제
- **월별 리포트**: 차트와 분석

### 📋 계획
- **PWA 설정**: 오프라인 지원 및 홈 화면 추가
- **사용자 인증**: 로그인/회원가입
- **데이터 내보내기**: CSV, PDF 형식
- **카테고리 관리**: 커스텀 카테고리 생성

## 🛠 기술 스택

- **프론트엔드**: Next.js 15, React, TypeScript
- **스타일링**: Tailwind CSS
- **아이콘**: Lucide React
- **백엔드**: Supabase (PostgreSQL + Storage + Auth)
- **OCR**: Google Cloud Vision API
- **호스팅**: Vercel

## 📦 설치 및 실행

### 1. 저장소 클론
```bash
git clone [repository-url]
cd receipt-app
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Cloud Vision API
GOOGLE_CLOUD_VISION_API_KEY=your_vision_api_key

# 개발환경 설정
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 4. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 앱을 확인하세요.

## 🔧 환경 설정

### Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. Database에서 다음 테이블 생성:

```sql
-- receipts 테이블
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

-- RLS 정책 설정
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see own receipts" ON receipts
  FOR ALL USING (auth.uid() = user_id);
```

3. Storage에서 `receipts` 버킷 생성
4. 프로젝트 URL과 API 키를 환경 변수에 설정

### Google Cloud Vision API 설정

1. [Google Cloud Console](https://console.cloud.google.com)에서 프로젝트 생성
2. Vision API 활성화
3. 서비스 계정 키 생성 또는 API 키 발급
4. 환경 변수에 API 키 설정

## 📱 사용법

### 1. 영수증 추가
- 홈 화면에서 "영수증 추가" 버튼 클릭
- 카메라 탭: 실시간으로 영수증 촬영
- 업로드 탭: 갤러리에서 이미지 선택 또는 드래그 앤 드롭
- OCR 처리 후 추출된 정보 확인 및 수정
- 저장 완료

### 2. 영수증 관리
- 홈 화면에서 최근 영수증 확인
- 영수증 카드 클릭으로 상세 정보 보기
- 월별 통계로 지출 현황 파악

## 🎨 UI 컴포넌트

### 재사용 가능한 컴포넌트
- `Button`: 다양한 스타일과 크기 지원
- `Loading`: 로딩 상태 표시
- `ReceiptCard`: 영수증 정보 카드
- `ImageInputTabs`: 이미지 입력 통합 인터페이스
- `CameraCapture`: 웹캠 실시간 촬영
- `ImageUpload`: 파일 업로드 및 드래그 앤 드롭

### 스타일 가이드
- **색상**: Blue (Primary), Gray (Secondary), Green (Success), Red (Error)
- **타이포그래피**: 시스템 폰트 스택 사용
- **간격**: 4px 단위 간격 시스템
- **반응형**: 모바일 우선, md 브레이크포인트 사용

## 🚧 개발 상태

### Phase 1: 기본 설정 ✅
- [x] Next.js 프로젝트 생성
- [x] 기본 라우팅 구조
- [x] UI 컴포넌트 시스템
- [x] TypeScript 타입 정의

### Phase 2: 이미지 입력 ✅
- [x] 카메라 API 구현
- [x] 파일 업로드 구현
- [x] 드래그 앤 드롭 지원
- [x] 이미지 미리보기

### Phase 3: OCR 연동 🚧
- [x] OCR 처리 시뮬레이션
- [ ] Google Vision API 실제 연동
- [ ] 텍스트 파싱 로직 개선
- [ ] 에러 처리 강화

### Phase 4: 데이터 관리 🚧
- [ ] Supabase 실제 연동
- [ ] 영수증 저장/조회/수정/삭제
- [ ] 검색 및 필터링
- [ ] 무한 스크롤

### Phase 5: 리포트 기능 📋
- [ ] 월별 집계 쿼리
- [ ] 차트 라이브러리 연동
- [ ] 카테고리별 분석
- [ ] 데이터 내보내기

## 🐛 알려진 이슈

- 현재 더미 데이터로 동작하며 실제 저장되지 않음
- OCR 처리가 시뮬레이션으로만 구현됨
- PWA 설정이 아직 완료되지 않음

## 🤝 기여하기

1. 저장소 포크
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 📄 라이선스

MIT License

## 📞 지원

이슈가 있거나 질문이 있으시면 GitHub Issues를 통해 문의해주세요.

---

**개발 진행 상황은 지속적으로 업데이트됩니다.**
