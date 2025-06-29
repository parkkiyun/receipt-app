import { createClient } from '@/lib/supabase/client'
import { Receipt, CreateReceiptData } from '@/types'

// UUID 형식 검증 함수
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// 영수증 목록 조회 (클라이언트 사이드)
export async function getReceipts(
  userId: string,
  limit = 10,
  offset = 0,
  year?: number,
  month?: number
): Promise<Receipt[]> {
  const supabase = createClient()
  let query = supabase
    .from('receipts')
    .select('*')
    .eq('user_id', userId)
    .order('receipt_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (year && month) {
    const startDate = new Date(year, month - 1, 1).toISOString()
    const endDate = new Date(year, month, 0).toISOString()
    query = query.gte('receipt_date', startDate).lte('receipt_date', endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching receipts:', error)
    throw new Error(error.message)
  }

  if (!data) {
    return []
  }

  const receiptsWithSignedUrls = await Promise.all(
    data.map(async (receipt) => {
      if (!receipt.image_url) return receipt;
      
      const { data: signedUrlData } = await supabase.storage
        .from('receipts')
        .createSignedUrl(receipt.image_url, 60 * 5); // 5분 유효
      
      return { ...receipt, image_url: signedUrlData?.signedUrl || receipt.image_url };
    })
  );

  return receiptsWithSignedUrls as Receipt[]
}

// 고급 검색으로 영수증 조회
export async function searchReceipts(
  userId: string,
  filters: {
    text?: string;
    storeName?: string;
    category?: string;
    minAmount?: number;
    maxAmount?: number;
    startDate?: string;
    endDate?: string;
  },
  limit = 50,
  offset = 0
): Promise<Receipt[]> {
  const supabase = createClient()
  let query = supabase
    .from('receipts')
    .select('*')
    .eq('user_id', userId)
    .order('receipt_date', { ascending: false })
    .range(offset, offset + limit - 1)

  // 텍스트 검색 (전체 텍스트에서 검색)
  if (filters.text) {
    query = query.or(`raw_text.ilike.%${filters.text}%,store_name.ilike.%${filters.text}%`)
  }

  // 가게명 검색
  if (filters.storeName) {
    query = query.ilike('store_name', `%${filters.storeName}%`)
  }

  // 카테고리 필터
  if (filters.category) {
    query = query.eq('category', filters.category)
  }

  // 금액 범위 필터
  if (filters.minAmount !== undefined && filters.minAmount !== null) {
    query = query.gte('total_amount', filters.minAmount)
  }
  if (filters.maxAmount !== undefined && filters.maxAmount !== null) {
    query = query.lte('total_amount', filters.maxAmount)
  }

  // 날짜 범위 필터
  if (filters.startDate) {
    query = query.gte('receipt_date', filters.startDate)
  }
  if (filters.endDate) {
    query = query.lte('receipt_date', filters.endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error searching receipts:', error)
    throw new Error(error.message)
  }

  if (!data) {
    return []
  }

  const receiptsWithSignedUrls = await Promise.all(
    data.map(async (receipt) => {
      if (!receipt.image_url) return receipt;
      
      const { data: signedUrlData } = await supabase.storage
        .from('receipts')
        .createSignedUrl(receipt.image_url, 60 * 5); // 5분 유효
      
      return { ...receipt, image_url: signedUrlData?.signedUrl || receipt.image_url };
    })
  );

  return receiptsWithSignedUrls as Receipt[]
}

// 카테고리 목록 조회
export async function getCategories(userId: string): Promise<string[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('receipts')
    .select('category')
    .eq('user_id', userId)
    .not('category', 'is', null)

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  if (!data) {
    return []
  }

  // 중복 제거하고 정렬
  const categories = [...new Set(data.map(item => item.category))]
    .filter(category => category && category.trim() !== '')
    .sort()

  return categories
}

// 전체 월별 통계 조회 (드롭다운용) - 클라이언트 사이드
export async function getOverallMonthlyStats(userId: string) {
  const supabase = createClient()
  let query = supabase
    .from('receipts')
    .select('receipt_date, total_amount')
    .order('receipt_date', { ascending: false });

  if (isValidUUID(userId)) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`전체 월별 통계 조회 실패: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  const monthlyStats = data.reduce((acc: Record<string, { month: string; total_amount: number; count: number }>, receipt: { receipt_date: string; total_amount?: number }) => {
    const month = receipt.receipt_date.slice(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = { month, total_amount: 0, count: 0 };
    }
    acc[month].total_amount += receipt.total_amount || 0;
    acc[month].count += 1;
    return acc;
  }, {} as Record<string, { month: string; total_amount: number; count: number }>);

  return Object.values(monthlyStats);
}

// 영수증 생성 (클라이언트 사이드)
export async function createReceipt(receiptData: CreateReceiptData) {
  // UUID가 유효하지 않은 경우 null로 저장 (개발 환경용)
  const validUserId = isValidUUID(receiptData.user_id) ? receiptData.user_id : null
  const supabase = createClient()

  const { data, error } = await supabase
    .from('receipts')
    .insert({
      ...receiptData,
      user_id: validUserId
    })
    .select()
    .single()

  if (error) {
    throw new Error(`영수증 저장 실패: ${error.message}`)
  }

  return data as Receipt
}

// 특정 영수증 조회 (클라이언트 사이드)
export async function getReceiptById(id: string): Promise<Receipt | null> {
  const supabase = createClient()
  const { data: receipt, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`영수증 조회 실패: ${error.message}`)
  }
  if (!receipt) {
    return null
  }

  if (receipt.image_url) {
    const { data: signedUrlData } = await supabase.storage
      .from('receipts')
      .createSignedUrl(receipt.image_url, 60 * 5) // 5분 유효
    
    receipt.image_url = signedUrlData?.signedUrl || receipt.image_url
  }

  return receipt as Receipt
}

// 영수증 삭제 (클라이언트 사이드)
export async function deleteReceipt(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('receipts')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`영수증 삭제 실패: ${error.message}`)
  }

  return true
}