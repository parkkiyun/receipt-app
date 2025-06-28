// 영수증 데이터 타입
export interface Receipt {
  id: string
  user_id: string
  image_url: string
  store_name: string | null
  total_amount: number | null
  receipt_date: string | null
  category: string
  raw_text: string | null
  created_at: string
  updated_at?: string
}

// 영수증 생성 타입
export type CreateReceiptData = Omit<Receipt, 'id' | 'created_at' | 'updated_at'>;

// 카테고리 타입
export interface Category {
  id: string
  name: string
  color: string
  created_at: string
}

// OCR 결과 타입
export interface OCRResult {
  text: string
  confidence: number
  store_name?: string
  total_amount?: number
  receipt_date?: string
}

// 이미지 업로드 상태 타입
export interface UploadStatus {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  error?: string
}

// 월별 리포트 타입
export interface MonthlyReport {
  month: string
  total_amount: number
  total_count: number
  categories: {
    [key: string]: {
      amount: number
      count: number
    }
  }
} 