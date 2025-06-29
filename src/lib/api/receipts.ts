import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Receipt, CreateReceiptData } from '@/types'

// UUID 형식 검증 함수
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// 영수증 목록 조회
export async function getReceipts(
  userId: string,
  limit = 10,
  offset = 0,
  year?: number,
  month?: number
): Promise<Receipt[]> {
  const supabase = await createSupabaseServerClient()
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

// 특정 영수증 조회
export async function getReceiptById(id: string): Promise<Receipt | null> {
  const supabase = await createSupabaseServerClient()
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

// 영수증 생성
export async function createReceipt(receiptData: CreateReceiptData) {
  // UUID가 유효하지 않은 경우 null로 저장 (개발 환경용)
  const validUserId = isValidUUID(receiptData.user_id) ? receiptData.user_id : null
  const supabase = await createSupabaseServerClient()

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

// 영수증 업데이트
export async function updateReceipt(id: string, updates: Partial<CreateReceiptData>) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('receipts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`영수증 업데이트 실패: ${error.message}`)
  }

  return data as Receipt
}

// 영수증 삭제
export async function deleteReceipt(id: string) {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('receipts')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`영수증 삭제 실패: ${error.message}`)
  }

  return true
}

// 월별 통계 조회
export async function getMonthlyStats(userId: string, year: number, month: number) {
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]
  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from('receipts')
    .select('total_amount, category')
    .gte('receipt_date', startDate)
    .lte('receipt_date', endDate)

  // UUID가 유효한 경우에만 user_id 필터 적용
  if (isValidUUID(userId)) {
    query = query.eq('user_id', userId)
  } else {
    console.log('개발 환경: 모든 사용자의 통계를 조회합니다.')
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`월별 통계 조회 실패: ${error.message}`)
  }

  // 통계 계산
  const totalAmount = data.reduce((sum: number, receipt: { total_amount?: number }) => sum + (receipt.total_amount || 0), 0)
  const totalCount = data.length
  const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0

  // 카테고리별 통계
  const categoryStats = data.reduce((acc: Record<string, { amount: number; count: number }>, receipt: { category?: string; total_amount?: number }) => {
    const category = receipt.category || 'misc'
    if (!acc[category]) {
      acc[category] = { amount: 0, count: 0 }
    }
    acc[category].amount += receipt.total_amount || 0
    acc[category].count += 1
    return acc
  }, {} as Record<string, { amount: number; count: number }>)

  return {
    totalAmount,
    totalCount,
    averageAmount,
    categoryStats
  }
}

// 전체 월별 통계 조회 (드롭다운용)
export async function getOverallMonthlyStats(userId: string) {
  const supabase = await createSupabaseServerClient()
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

// 카테고리별 통계 조회
export async function getCategoryStats(userId: string, startDate?: string, endDate?: string) {
  const supabase = await createSupabaseServerClient()
  let query = supabase
    .from('receipts')
    .select('category, total_amount')

  // UUID가 유효한 경우에만 user_id 필터 적용
  if (isValidUUID(userId)) {
    query = query.eq('user_id', userId)
  } else {
    console.log('개발 환경: 모든 사용자의 카테고리 통계를 조회합니다.')
  }

  if (startDate) {
    query = query.gte('receipt_date', startDate)
  }

  if (endDate) {
    query = query.lte('receipt_date', endDate)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`카테고리 통계 조회 실패: ${error.message}`)
  }

  return data.reduce((acc: Record<string, { amount: number; count: number }>, receipt: { category?: string; total_amount?: number }) => {
    const category = receipt.category || 'misc'
    if (!acc[category]) {
      acc[category] = { amount: 0, count: 0 }
    }
    acc[category].amount += receipt.total_amount || 0
    acc[category].count += 1
    return acc
  }, {} as Record<string, { amount: number; count: number }>)
} 