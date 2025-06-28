'use client';

import { supabase } from '@/lib/supabase';
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

// 인증 상태 변경 감지
export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null)
  })
} 