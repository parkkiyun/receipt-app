'use client'

import { useState } from 'react'
import { Camera, Upload } from 'lucide-react'
import CameraCapture from './CameraCapture'
import ImageUpload from './ImageUpload'
import { UploadStatus } from '@/types'

type TabType = 'camera' | 'upload'

interface ImageInputTabsProps {
  onImageSelect: (file: File) => void
  uploadStatus?: UploadStatus
  defaultTab?: TabType
}

export default function ImageInputTabs({
  onImageSelect,
  uploadStatus = { status: 'idle', progress: 0 },
  defaultTab = 'camera'
}: ImageInputTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab)

  const tabs = [
    {
      id: 'camera' as TabType,
      label: '카메라',
      icon: Camera,
      description: '실시간 촬영'
    },
    {
      id: 'upload' as TabType,
      label: '파일 업로드',
      icon: Upload,
      description: '갤러리에서 선택'
    }
  ]

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* 탭 헤더 */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex items-center justify-center space-x-2 py-4 px-6 text-sm font-medium border-b-2 transition-colors
                ${isActive
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <Icon className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">{tab.label}</div>
                <div className="text-xs opacity-75">{tab.description}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* 탭 컨텐츠 */}
      <div className="min-h-[400px]">
        {activeTab === 'camera' && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                카메라로 영수증 촬영
              </h3>
              <p className="text-sm text-gray-600">
                영수증을 평평하게 펼치고 충분한 조명에서 촬영해주세요
              </p>
            </div>
            
            <CameraCapture
              onCapture={onImageSelect}
            />

            {/* 촬영 팁 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">📷 촬영 팁</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 영수증을 평평하게 펼쳐주세요</li>
                <li>• 충분한 조명에서 촬영하세요</li>
                <li>• 영수증이 프레임 전체에 들어오도록 해주세요</li>
                <li>• 손이 흔들리지 않게 주의하세요</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                파일에서 영수증 업로드
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
        )}
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