'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { getReceiptById, deleteReceipt } from '@/lib/api/receipts'
import { Receipt } from '@/types'
import Button from '@/components/ui/Button'
import Loading from '@/components/ui/Loading'
import { ArrowLeft, Edit, Trash2, Calendar, Store, Tag, FileText, DollarSign } from 'lucide-react'

export default function ReceiptDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      const fetchReceipt = async () => {
        try {
          setLoading(true)
          const data = await getReceiptById(id)
          setReceipt(data)
        } catch (err) {
          setError(err instanceof Error ? err.message : '영수증 정보를 가져오는데 실패했습니다.');
        } finally {
          setLoading(false)
        }
      }
      fetchReceipt()
    }
  }, [id])

  const handleDelete = async () => {
    if (!receipt) return
    if (window.confirm('정말 이 영수증을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        await deleteReceipt(receipt.id)
        alert('영수증이 삭제되었습니다.')
        router.push('/')
      } catch (err) {
        const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
        alert(`삭제 실패: ${message}`)
      }
    }
  }

  if (loading) return <div className="flex justify-center items-center h-screen"><Loading /></div>
  if (error) return <div className="text-red-500 text-center p-4">오류: {error}</div>
  if (!receipt) return <div className="text-center p-4">영수증을 찾을 수 없습니다.</div>

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={() => router.back()} className="flex items-center">
          <ArrowLeft className="h-5 w-5 mr-2" />
          뒤로가기
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" disabled>
            <Edit className="h-5 w-5 mr-2" />
            수정
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-5 w-5 mr-2" />
            삭제
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
        {receipt.image_url && (
          <div className="relative w-full h-96 bg-gray-100 dark:bg-gray-700">
            <Image
              src={receipt.image_url}
              alt={receipt.store_name || '영수증 이미지'}
              layout="fill"
              objectFit="contain"
            />
          </div>
        )}
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-100">{receipt.store_name || '가게 이름 없음'}</h1>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 mr-3 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">결제 금액</p>
                <p className="font-semibold text-lg">{receipt.total_amount ? `${Number(receipt.total_amount).toLocaleString()}원` : 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-3 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">거래 일시</p>
                <p className="font-semibold">{receipt.receipt_date ? new Date(receipt.receipt_date).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Tag className="h-5 w-5 mr-3 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">카테고리</p>
                <p className="font-semibold capitalize">{receipt.category || '미분류'}</p>
              </div>
            </div>
            <div className="flex items-center">
               <Store className="h-5 w-5 mr-3 text-gray-400" />
               <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">가게명</p>
                <p className="font-semibold">{receipt.store_name || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          {receipt.raw_text && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2 flex items-center text-gray-800 dark:text-gray-100">
                <FileText className="h-5 w-5 mr-2" />
                OCR 추출 원본 텍스트
              </h2>
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-sans">
                {receipt.raw_text}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 