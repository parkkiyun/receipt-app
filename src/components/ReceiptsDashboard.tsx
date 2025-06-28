'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { User as SupabaseUser } from '@supabase/supabase-js'
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'
import ReceiptCard from '@/components/ReceiptCard'
import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import { Receipt } from '@/types'
import { getReceipts, getOverallMonthlyStats } from '@/lib/api/receipts'

interface MonthlyStat {
  month: string;
  total_amount: number;
  count: number;
}

export default function ReceiptsDashboard({ user }: { user: SupabaseUser | null }) {
  const router = useRouter()
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7))
  const [isLoading, setIsLoading] = useState(true)

  const fetchReceiptsForMonth = useCallback(async (userId: string, monthStr: string) => {
    setIsLoading(true);
    const [year, month] = monthStr.split('-').map(Number);
    try {
      const fetchedReceipts = await getReceipts(userId, 100, 0, year, month); // limit 100
      setReceipts(fetchedReceipts);
    } catch (error) {
      console.error('영수증 로딩 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const fetchAllMonthlyStats = useCallback(async (userId: string) => {
    try {
        const stats = await getOverallMonthlyStats(userId);
        setMonthlyStats(stats);
        if (stats.length > 0 && !stats.some(s => s.month === selectedMonth)) {
            setSelectedMonth(stats[0].month);
        }
    } catch (error) {
        console.error('월별 통계 로딩 실패:', error);
    }
  }, [selectedMonth])

  useEffect(() => {
    if (user) {
      fetchAllMonthlyStats(user.id);
    } else {
      router.push('/login');
    }
  }, [user, fetchAllMonthlyStats, router]);

  useEffect(() => {
    if (user) {
        fetchReceiptsForMonth(user.id, selectedMonth);
    }
  }, [user, selectedMonth, fetchReceiptsForMonth]);


  if (!user) {
    return <div className="flex justify-center items-center h-[calc(100vh-4rem)]"><Loading text="사용자 정보를 확인하는 중..." /></div>
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">내 영수증</h1>
        <div className="flex items-center gap-4">
            <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="p-2 border rounded-md bg-white"
            >
            {monthlyStats.map(stat => (
                <option key={stat.month} value={stat.month}>
                    {stat.month} ({stat.count}개 / {stat.total_amount.toLocaleString()}원)
                </option>
            ))}
            </select>
            <Button asChild>
                <Link href="/add">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    영수증 추가
                </Link>
            </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center p-8"><Loading text="영수증을 불러오는 중입니다..." /></div>
      ) : receipts.length === 0 ? (
        <div className="text-center py-12 px-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">{selectedMonth}에는 아직 영수증이 없습니다.</p>
            <Button asChild>
                <Link href="/add">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    첫 영수증 추가하기
                </Link>
            </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {receipts.map((receipt) => (
            <ReceiptCard key={receipt.id} receipt={receipt} />
          ))}
        </div>
      )}
    </>
  )
} 