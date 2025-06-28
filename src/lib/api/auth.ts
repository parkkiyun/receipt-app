import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

// 현재 사용자 정보 가져오기
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('사용자 정보 조회 오류:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('사용자 정보 조회 중 예외 발생:', error)
    return null
  }
}

// 익명 사용자 생성 (개발/테스트 목적)
export async function signInAnonymously(): Promise<User | null> {
  try {
    const { data, error } = await supabase.auth.signInAnonymously()
    
    if (error) {
      throw new Error(`익명 로그인 실패: ${error.message}`)
    }
    
    return data.user
  } catch (error) {
    console.error('익명 로그인 오류:', error)
    throw error
  }
}

// 이메일로 회원가입
export async function signUpWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    
    if (error) {
      throw new Error(`회원가입 실패: ${error.message}`)
    }
    
    return data
  } catch (error) {
    console.error('회원가입 오류:', error)
    throw error
  }
}

// 이메일로 로그인
export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      throw new Error(`로그인 실패: ${error.message}`)
    }
    
    return data
  } catch (error) {
    console.error('로그인 오류:', error)
    throw error
  }
}

// 로그아웃
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw new Error(`로그아웃 실패: ${error.message}`)
    }
    
    return true
  } catch (error) {
    console.error('로그아웃 오류:', error)
    throw error
  }
}

// 개발용: 임시 사용자 ID 생성 (실제 인증 없이 테스트)
export function generateTempUserId(): string {
  // 세션 스토리지에서 기존 ID 확인
  if (typeof window !== 'undefined') {
    let tempUserId = sessionStorage.getItem('temp_user_id')
    
    if (!tempUserId) {
      tempUserId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      sessionStorage.setItem('temp_user_id', tempUserId)
    }
    
    return tempUserId
  }
  
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

// 개발용 UUID 형식 사용자 ID 생성
export function generateDevUserId(): string {
  if (typeof window !== 'undefined') {
    let devUserId = localStorage.getItem('dev_user_id')
    
    if (!devUserId) {
      // UUID v4 형식으로 생성
      devUserId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
      localStorage.setItem('dev_user_id', devUserId)
      console.log('개발용 사용자 ID 생성:', devUserId)
    }
    
    return devUserId
  }
  
  // 서버사이드에서는 기본 UUID 반환
  return '00000000-0000-4000-8000-000000000000'
}

// 사용자 ID 가져오기 (현재 사용자 또는 임시 사용자)
export async function getUserId(): Promise<string> {
  try {
    const user = await getCurrentUser()
    
    if (user) {
      return user.id
    }
    
    // 개발 환경에서는 자동으로 익명 로그인 시도
    console.log('사용자가 인증되지 않았습니다. 익명 로그인을 시도합니다...')
    const anonymousUser = await signInAnonymously()
    
    if (anonymousUser) {
      return anonymousUser.id
    }
    
    // 익명 로그인도 실패하면 개발용 UUID 생성
    return generateDevUserId()
    
  } catch (error) {
    console.error('사용자 ID 가져오기 실패:', error)
    // 에러 발생시 개발용 UUID 반환
    return generateDevUserId()
  }
}

// 인증 상태 변경 감지
export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null)
  })
}

// 세션 갱신
export async function refreshSession() {
  try {
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      throw new Error(`세션 갱신 실패: ${error.message}`)
    }
    
    return data
  } catch (error) {
    console.error('세션 갱신 오류:', error)
    throw error
  }
} 