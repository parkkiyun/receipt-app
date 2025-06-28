'use client'

import { useState, useEffect, useCallback } from 'react'
import { Camera, Upload, FileText, PlusCircle, LogOut, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import ReceiptCard from '@/components/ReceiptCard'
import Loading from '@/components/ui/Loading'
import { Receipt } from '@/types'
import { getReceipts, getMonthlyStats } from '@/lib/api/receipts'
import { getCurrentUser, signOut } from '@/lib/api/auth'
import { User as SupabaseUser } from '@supabase/supabase-js'

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [monthlyStats, setMonthlyStats] = useState({
    totalAmount: 0,
    totalCount: 0,
    averageAmount: 0
  })
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const checkAuth = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('인증 확인 오류:', error)
      router.push('/login')
    } finally {
      setAuthLoading(false)
    }
  }, [router])

  const loadData = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const recentReceipts = await getReceipts(user.id, 4, 0)
      setReceipts(recentReceipts)

      const now = new Date()
      const stats = await getMonthlyStats(user.id, now.getFullYear(), now.getMonth() + 1)
      setMonthlyStats(stats)

    } catch (error) {
      console.error('데이터 로드 오류:', error)
      setError(error instanceof Error ? error.message : '데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [user])

  // 인증 상태 확인
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // 인증된 사용자의 데이터 로드
  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, loadData])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('로그아웃 오류:', error)
    }
  }

  const handleAddReceipt = () => {
    router.push('/add')
  }

  const handleReceiptClick = (receipt: Receipt) => {
    router.push(`/receipts/${receipt.id}`)
  }

  // 인증 로딩 중
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" text="인증 상태를 확인하는 중..." />
      </div>
    )
  }

  // 인증되지 않은 사용자는 이미 리다이렉트됨
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">영수증 아카이브</h1>
              <p className="text-gray-600 mt-1">영수증을 스캔하고 자동으로 정리하세요</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <Button
                onClick={handleAddReceipt}
                className="flex items-center space-x-2"
              >
                <PlusCircle className="h-5 w-5" />
                <span>영수증 추가</span>
              </Button>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>로그아웃</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 이번 달 통계 */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">이번 달 요약</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">총 영수증</p>
                  <p className="text-2xl font-bold text-gray-900">{monthlyStats.totalCount}개</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-green-600 font-bold text-lg">₩</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">총 지출</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Intl.NumberFormat('ko-KR').format(monthlyStats.totalAmount)}원
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="text-purple-600 font-bold text-lg">📊</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">평균 지출</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Intl.NumberFormat('ko-KR').format(Math.round(monthlyStats.averageAmount))}원
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 빠른 액션 */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">빠른 추가</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleAddReceipt}
              className="flex items-center space-x-4 p-6 bg-white rounded-lg border border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="p-3 bg-blue-100 rounded-lg">
                <Camera className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">카메라로 촬영</h3>
                <p className="text-sm text-gray-600">영수증을 직접 촬영해서 추가</p>
              </div>
            </button>
            
            <button
              onClick={handleAddReceipt}
              className="flex items-center space-x-4 p-6 bg-white rounded-lg border border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-colors text-left"
            >
              <div className="p-3 bg-green-100 rounded-lg">
                <Upload className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">파일 업로드</h3>
                <p className="text-sm text-gray-600">갤러리에서 영수증 이미지 선택</p>
              </div>
            </button>
          </div>
        </section>

        {/* 최근 영수증 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">최근 영수증</h2>
            <Button variant="ghost" size="sm">
              전체 보기
            </Button>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <Loading size="lg" text="영수증을 불러오는 중..." />
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-white rounded-lg border border-dashed border-red-300">
              <div className="text-red-500 mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                데이터를 불러올 수 없습니다
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => loadData()} variant="outline">
                다시 시도
              </Button>
            </div>
          ) : receipts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {receipts.map((receipt) => (
                <ReceiptCard
                  key={receipt.id}
                  receipt={receipt}
                  onClick={() => handleReceiptClick(receipt)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
              <div className="text-gray-400 mb-4">📂</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                아직 영수증이 없습니다
              </h3>
              <p className="text-gray-600 mb-4">
                새로운 영수증을 추가하여 시작하세요.
              </p>
              <Button onClick={handleAddReceipt}>
                영수증 추가하기
              </Button>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
