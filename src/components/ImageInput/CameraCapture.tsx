'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Camera } from 'lucide-react'
import Button from '@/components/ui/Button'

interface CameraCaptureProps {
  onCapture: (file: File) => void
}

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [facingMode] = useState<'user' | 'environment'>('environment')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // 카메라 스트림 시작
  const startCamera = useCallback(async () => {
    try {
      setError(null)
      
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsStreaming(true)
        setHasPermission(true)
      }
    } catch (err) {
      console.error('카메라 접근 오류:', err)
      
      if (err instanceof Error) {
        switch (err.name) {
          case 'NotAllowedError':
            setError('카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.')
            break
          case 'NotFoundError':
            setError('카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.')
            break
          case 'NotSupportedError':
            setError('이 브라우저에서는 카메라 기능을 지원하지 않습니다.')
            break
          default:
            setError('카메라에 접근할 수 없습니다. 잠시 후 다시 시도해주세요.')
        }
      }
      
      setHasPermission(false)
    }
  }, [facingMode])

  // 사진 촬영
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `receipt-${Date.now()}.jpg`, { 
          type: 'image/jpeg' 
        })
        onCapture(file)
      }
    }, 'image/jpeg', 0.8)
  }, [onCapture])

  useEffect(() => {
    if (navigator.mediaDevices) {
      startCamera()
    } else {
      setError('이 브라우저에서는 카메라 기능을 지원하지 않습니다.')
      setHasPermission(false)
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [startCamera])

  if (hasPermission === false || error) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <Camera className="h-16 w-16 mx-auto text-red-500 opacity-50 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          카메라에 접근할 수 없습니다
        </h3>
        <p className="text-gray-600 mb-6">
          {error || '카메라 권한이 필요합니다.'}
        </p>
        <Button onClick={startCamera}>다시 시도</Button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <div className="relative bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-64 md:h-96 object-cover"
        />
        
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg opacity-50" />
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
            영수증을 프레임 안에 맞춰주세요
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-center space-x-4">
          <Button
            onClick={capturePhoto}
            disabled={!isStreaming}
            size="lg"
            className="px-8"
          >
            <Camera className="h-5 w-5 mr-2" />
            촬영
          </Button>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
} 