'use client'

import ImageUpload from './ImageUpload'
import { UploadStatus } from '@/types'

interface ImageInputSimpleProps {
  onImageSelect: (file: File) => void
  uploadStatus?: UploadStatus
}

export default function ImageInputSimple({
  onImageSelect,
  uploadStatus = { status: 'idle', progress: 0 }
}: ImageInputSimpleProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="space-y-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            영수증 업로드
          </h3>
          <p className="text-sm text-gray-600">
            갤러리에서 영수증 이미지를 선택하거나 드래그 앤 드롭으로 업로드하세요
          </p>
        </div>
        
        <ImageUpload
          onImageSelect={onImageSelect}
          uploadStatus={uploadStatus}
        />

        {/* 업로드 팁 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">📁 업로드 팁</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• JPEG, PNG, WebP 형식을 지원합니다</li>
            <li>• 최대 10MB까지 업로드 가능합니다</li>
            <li>• 선명하고 해상도가 높은 이미지일수록 인식률이 좋습니다</li>
            <li>• 여러 영수증은 개별적으로 업로드해주세요</li>
          </ul>
        </div>
      </div>

      {/* 진행 상태 표시 */}
      {(uploadStatus.status === 'uploading' || uploadStatus.status === 'processing') && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">
              {uploadStatus.status === 'uploading' ? '업로드 중...' : 'OCR 처리 중...'}
            </span>
            <span className="text-sm text-blue-700">
              {uploadStatus.progress}%
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadStatus.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* 에러 상태 */}
      {uploadStatus.status === 'error' && uploadStatus.error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-red-600">⚠️</span>
            <div>
              <p className="text-sm font-medium text-red-900">처리 중 오류가 발생했습니다</p>
              <p className="text-sm text-red-700">{uploadStatus.error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}