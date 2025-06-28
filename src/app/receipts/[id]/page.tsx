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
    <div className="container max-w-2xl py-8">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          뒤로가기
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" disabled>
            <Edit className="h-4 w-4 mr-2" />
            수정
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            삭제
          </Button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden border">
        {receipt.image_url && (
          <div className="relative w-full h-auto bg-gray-100 p-4">
            <Image
              src={receipt.image_url}
              alt={receipt.store_name || '영수증 이미지'}
              width={800}
              height={1200}
              className="rounded-md"
            />
          </div>
        )}
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-500">가게 이름</p>
            <h1 className="text-3xl font-bold text-gray-800">{receipt.store_name || '가게 이름 없음'}</h1>
          </div>
          
          {receipt.description && (
            <div>
              <p className="text-sm text-gray-500">적요</p>
              <p className="text-lg text-gray-700">{receipt.description}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <InfoItem icon={DollarSign} label="결제 금액" value={receipt.total_amount ? `${Number(receipt.total_amount).toLocaleString()}원` : 'N/A'} />
            <InfoItem icon={Calendar} label="거래 일시" value={receipt.receipt_date ? new Date(receipt.receipt_date).toLocaleDateString() : 'N/A'} />
            <InfoItem icon={Tag} label="카테고리" value={receipt.category || '미분류'} className="capitalize" />
          </div>
          
          {receipt.raw_text && (
            <div className="pt-4 border-t">
              <h2 className="text-lg font-semibold mb-2 flex items-center text-gray-800">
                <FileText className="h-5 w-5 mr-2 text-gray-500" />
                OCR 추출 원본
              </h2>
              <pre className="bg-gray-50 p-4 rounded-md text-sm text-gray-600 whitespace-pre-wrap font-sans">
                {receipt.raw_text}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const InfoItem = ({ icon: Icon, label, value, className }: { icon: React.ElementType, label: string, value: string, className?: string }) => (
  <div className="flex items-start">
    <Icon className="h-5 w-5 mr-3 text-gray-400 mt-1" />
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`font-semibold ${className}`}>{value}</p>
    </div>
  </div>
) 