'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { getReceipts } from '@/lib/api/receipts'
import { Receipt } from '@/types'
import Loading from '@/components/ui/Loading'
import ReceiptCard from '@/components/ReceiptCard'
import Button from '@/components/ui/Button'
import { PlusCircle, ArrowLeft, ArrowRight } from 'lucide-react'

export default function ReceiptsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date())

  const supabase = createClient();

  const fetchReceipts = useCallback(async (userId: string, year: number, month: number) => {
    setLoading(true)
    try {
      const data = await getReceipts(userId, 100, 0, year, month) // Limit 100 per month
      setReceipts(data)
    } catch (error) {
      console.error('Failed to fetch receipts:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const checkUserAndFetchData = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser)
        fetchReceipts(currentUser.id, date.getFullYear(), date.getMonth() + 1)
      } else {
        router.push('/login')
      }
    }
    checkUserAndFetchData()
  }, [date, fetchReceipts, router, supabase.auth])
  
  const handlePrevMonth = () => {
    setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))
  }

  const handleReceiptClick = (receipt: Receipt) => {
    router.push(`/receipts/${receipt.id}`)
  }

  if (!user) {
    return <div className="flex justify-center items-center h-[calc(100vh-4rem)]"><Loading text="사용자 확인 중..." /></div>
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">전체 영수증</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handlePrevMonth}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-xl font-semibold w-32 text-center">
            {date.getFullYear()}년 {date.getMonth() + 1}월
          </span>
          <Button variant="outline" onClick={handleNextMonth}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12"><Loading text="영수증을 불러오는 중..." /></div>
      ) : receipts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {receipts.map(receipt => (
            <ReceiptCard key={receipt.id} receipt={receipt} onClick={() => handleReceiptClick(receipt)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-medium">해당 월에 영수증이 없습니다.</h3>
          <p className="text-gray-600 mt-2 mb-4">다른 월을 선택하거나 새 영수증을 추가하세요.</p>
          <Button onClick={() => router.push('/add')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            영수증 추가하기
          </Button>
        </div>
      )}
    </div>
  )
} 