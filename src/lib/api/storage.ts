import { supabase } from '@/lib/supabase'

// 이미지 업로드
export async function uploadReceiptImage(file: File, userId: string): Promise<string> {
  try {
    // 파일명 생성 (타임스탬프 + 랜덤 문자열)
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const fileExt = file.name.split('.').pop()
    const fileName = `${timestamp}_${randomStr}.${fileExt}`
    
    // 사용자별 폴더 구조: userId/year/month/filename
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const filePath = `${userId}/${year}/${month}/${fileName}`

    // 파일 업로드
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw new Error(`이미지 업로드 실패: ${error.message}`)
    }

    return data.path
  } catch (error) {
    console.error('이미지 업로드 오류:', error)
    throw error
  }
}

// 서명된 URL 생성 (1시간 유효)
export async function getSignedImageUrl(imagePath: string): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from('receipts')
      .createSignedUrl(imagePath, 3600) // 1시간

    if (error) {
      throw new Error(`이미지 URL 생성 실패: ${error.message}`)
    }

    return data.signedUrl
  } catch (error) {
    console.error('이미지 URL 생성 오류:', error)
    throw error
  }
}

// 여러 이미지의 서명된 URL 생성
export async function getSignedImageUrls(imagePaths: string[]): Promise<Record<string, string>> {
  try {
    const urls: Record<string, string> = {}
    
    const promises = imagePaths.map(async (path) => {
      const signedUrl = await getSignedImageUrl(path)
      urls[path] = signedUrl
    })

    await Promise.all(promises)
    return urls
  } catch (error) {
    console.error('여러 이미지 URL 생성 오류:', error)
    throw error
  }
}

// 이미지 삭제
export async function deleteReceiptImage(imagePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('receipts')
      .remove([imagePath])

    if (error) {
      throw new Error(`이미지 삭제 실패: ${error.message}`)
    }

    return true
  } catch (error) {
    console.error('이미지 삭제 오류:', error)
    throw error
  }
}

// 이미지 메타데이터 조회
export async function getImageMetadata(imagePath: string) {
  try {
    const { data, error } = await supabase.storage
      .from('receipts')
      .list(imagePath.split('/').slice(0, -1).join('/'))

    if (error) {
      throw new Error(`이미지 메타데이터 조회 실패: ${error.message}`)
    }

    const fileName = imagePath.split('/').pop()
    const fileInfo = data.find(file => file.name === fileName)

    return fileInfo
  } catch (error) {
    console.error('이미지 메타데이터 조회 오류:', error)
    throw error
  }
}

// 이미지 압축 (클라이언트 사이드)
export function compressImage(file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // 비율 계산
      let { width, height } = img
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width *= ratio
        height *= ratio
      }

      // 캔버스 크기 설정
      canvas.width = width
      canvas.height = height

      // 이미지 그리기
      ctx?.drawImage(img, 0, 0, width, height)

      // Blob으로 변환
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            reject(new Error('이미지 압축 실패'))
          }
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => reject(new Error('이미지 로드 실패'))
    img.src = URL.createObjectURL(file)
  })
}

// 파일 크기 검증
export function validateImageFile(file: File, maxSize = 10 * 1024 * 1024): { valid: boolean; error?: string } {
  // 파일 타입 검증
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: '지원되지 않는 파일 형식입니다. JPEG, PNG, WebP 파일만 업로드 가능합니다.'
    }
  }

  // 파일 크기 검증
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024)
    return {
      valid: false,
      error: `파일 크기가 너무 큽니다. ${maxSizeMB}MB 이하의 파일만 업로드 가능합니다.`
    }
  }

  return { valid: true }
} 