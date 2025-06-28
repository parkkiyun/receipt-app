import { Receipt } from '@/types'
import { Calendar, Store, DollarSign } from 'lucide-react'
import Image from 'next/image'

interface ReceiptCardProps {
  receipt: Receipt
  onClick?: () => void
}

export default function ReceiptCard({ receipt, onClick }: ReceiptCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      food: 'bg-orange-100 text-orange-800',
      shopping: 'bg-blue-100 text-blue-800',
      transport: 'bg-green-100 text-green-800',
      healthcare: 'bg-red-100 text-red-800',
      entertainment: 'bg-purple-100 text-purple-800',
      misc: 'bg-gray-100 text-gray-800'
    }
    return colors[category] || colors.misc
  }

  return (
    <div
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
      onClick={onClick}
    >
      <div className="p-4">
        {/* 썸네일과 기본 정보 */}
        <div className="flex items-start space-x-4">
          {/* 영수증 이미지 썸네일 */}
          <div className="flex-shrink-0">
            <div className="w-16 h-20 bg-gray-100 rounded-md overflow-hidden">
              {receipt.image_url ? (
                <Image
                  src={receipt.image_url}
                  alt="영수증 이미지"
                  width={64}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Store className="h-6 w-6" />
                </div>
              )}
            </div>
          </div>

          {/* 영수증 정보 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {receipt.store_name || '매장명 없음'}
              </h3>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(receipt.category)}`}
              >
                {receipt.category}
              </span>
            </div>

            {/* 금액 */}
            {receipt.total_amount && (
              <div className="flex items-center mt-2 text-xl font-bold text-gray-900">
                <DollarSign className="h-5 w-5 mr-1" />
                {formatAmount(receipt.total_amount)}
              </div>
            )}

            {/* 날짜 */}
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-1" />
              {receipt.receipt_date
                ? formatDate(receipt.receipt_date)
                : formatDate(receipt.created_at)
              }
            </div>
          </div>
        </div>

        {/* 원본 텍스트 미리보기 (있는 경우) */}
        {receipt.raw_text && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 line-clamp-2">
              {receipt.raw_text.substring(0, 100)}
              {receipt.raw_text.length > 100 && '...'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 