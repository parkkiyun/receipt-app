'use client'

import { useState, useEffect, useCallback } from 'react'
import { PlusCircle, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import ReceiptCard from '@/components/ReceiptCard'
import Loading from '@/components/ui/Loading'
import { Receipt } from '@/types'
import { getReceipts, getMonthlyStats } from '@/lib/api/receipts'
import { getCurrentUser } from '@/lib/api/auth'
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
  
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, loadData])

  const handleAddReceipt = () => {
    router.push('/add')
  }

  const handleReceiptClick = (receipt: Receipt) => {
    router.push(`/receipts/${receipt.id}`)
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loading size="lg" text="인증 상태를 확인하는 중..." />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container py-8">
      {/* 이번 달 통계 */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">이번 달 요약</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="총 영수증" value={`${monthlyStats.totalCount}개`} />
          <StatCard title="총 지출" value={`${new Intl.NumberFormat('ko-KR').format(monthlyStats.totalAmount)}원`} />
          <StatCard title="평균 지출" value={`${new Intl.NumberFormat('ko-KR').format(Math.round(monthlyStats.averageAmount))}원`} />
        </div>
      </section>

      {/* 최근 영수증 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">최근 영수증</h2>
          <Button onClick={() => router.push('/add')} size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            새 영수증 추가
          </Button>
        </div>
        
        {loading ? (
          <div className="text-center py-12"><Loading text="영수증을 불러오는 중..." /></div>
        ) : error ? (
          <div className="text-center py-12 bg-red-50 rounded-lg">
            <p className="text-red-600">{error}</p>
            <Button onClick={() => loadData()} variant="outline" className="mt-4">
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
          <div className="text-center py-12 bg-gray-100 rounded-lg">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
    </div>
  )
}

const StatCard = ({ title, value }: { title: string; value: string }) => (
  <div className="bg-white rounded-lg p-6 shadow-sm border">
    <p className="text-sm font-medium text-gray-600">{title}</p>
    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
  </div>
);
