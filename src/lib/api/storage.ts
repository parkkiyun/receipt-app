import { createSupabaseServerClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

// 이미지 업로드
export async function uploadReceiptImage(file: File, userId: string): Promise<string> {
  const supabase = createSupabaseServerClient()
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${uuidv4()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('receipts')
    .upload(fileName, file)

  if (error) {
    console.error('이미지 업로드 오류:', error)
    throw new Error('이미지 업로드에 실패했습니다.')
  }

  return data.path
}

// 파일 목록 가져오기 (특정 사용자)
export async function listFiles(userId: string) {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase.storage.from('receipts').list(userId)
  if (error) throw error
  return data
}

// 파일 삭제
export async function deleteFile(filePath: string) {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase.storage.from('receipts').remove([filePath])
  if (error) throw error
  return data
}

// 이미지 URL 가져오기
export async function getImageUrl(filePath: string): Promise<string | null> {
  const supabase = createSupabaseServerClient()
  const { data } = supabase.storage.from('receipts').getPublicUrl(filePath)
  return data.publicUrl
}
