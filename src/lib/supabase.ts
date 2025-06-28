import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 이미지 업로드 함수
export const uploadImage = async (file: File, userId: string) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random()}.${fileExt}`
  const filePath = `${userId}/${fileName}`

  const { data, error } = await supabase.storage
    .from('receipts')
    .upload(filePath, file)

  if (error) {
    throw error
  }

  return data
}

// 서명된 URL 생성
export const getSignedUrl = async (filePath: string) => {
  const { data } = await supabase.storage
    .from('receipts')
    .createSignedUrl(filePath, 3600) // 1시간 유효

  return data?.signedUrl
} 