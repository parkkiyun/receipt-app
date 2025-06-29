'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import Image from 'next/image'
import { Upload, X, FileImage } from 'lucide-react'
import Button from '@/components/ui/Button'
import Loading from '@/components/ui/Loading'
import { UploadStatus } from '@/types'

interface ImageUploadProps {
  onImageSelect: (file: File) => void
  onRemove?: () => void
  uploadStatus?: UploadStatus
  maxSize?: number // MB
  acceptedTypes?: string[]
}

export default function ImageUpload({
  onImageSelect,
  onRemove,
  uploadStatus = { status: 'idle', progress: 0 },
  maxSize = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 파일 유효성 검사
  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return '지원되지 않는 파일 형식입니다. JPEG, PNG, WebP 파일만 업로드 가능합니다.'
    }
    
    if (file.size > maxSize * 1024 * 1024) {
      return `파일 크기가 너무 큽니다. ${maxSize}MB 이하의 파일만 업로드 가능합니다.`
    }
    
    return null
  }

  // 파일 처리
  const handleFile = (file: File) => {
    const error = validateFile(file)
    if (error) {
      alert(error)
      return
    }

    // 미리보기 생성
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    onImageSelect(file)
  }

  // 드래그 앤 드롭 이벤트
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  // 파일 선택
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  // 파일 선택 다이얼로그 열기
  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  // 이미지 제거
  const handleRemove = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onRemove?.()
  }

  // 업로드 중이면 로딩 표시
  if (uploadStatus.status === 'uploading' || uploadStatus.status === 'processing') {
    return (
      <div className="border-2 border-gray-300 border-dashed rounded-lg p-8 text-center">
        <Loading size="lg" text={
          uploadStatus.status === 'uploading' 
            ? '이미지 업로드 중...' 
            : 'OCR 처리 중...'
        } />
        {uploadStatus.progress > 0 && (
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadStatus.progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">{uploadStatus.progress}%</p>
          </div>
        )}
      </div>
    )
  }

  // 이미지 미리보기가 있는 경우
  if (preview) {
    return (
      <div className="relative">
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden relative" style={{ height: '256px' }}>
          <Image
            src={preview}
            alt="업로드된 이미지"
            layout="fill"
            objectFit="contain"
            className="bg-gray-50"
          />
        </div>
        <button
          onClick={handleRemove}
          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 드래그 앤 드롭 영역 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
        onClick={openFileDialog}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className={`p-4 rounded-full ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}`}>
            {isDragging ? (
              <Upload className="h-8 w-8 text-blue-600" />
            ) : (
              <FileImage className="h-8 w-8 text-gray-600" />
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isDragging ? '여기에 파일을 놓으세요' : '이미지를 업로드하세요'}
            </h3>
            <p className="text-gray-600 mb-4">
              파일을 드래그 앤 드롭하거나 클릭해서 선택하세요
            </p>
            <Button variant="outline">
              파일 선택
            </Button>
          </div>
          
          <div className="text-xs text-gray-500">
            <p>지원 형식: JPEG, PNG, WebP</p>
            <p>최대 크기: {maxSize}MB</p>
          </div>
        </div>
      </div>
    </div>
  )
} 