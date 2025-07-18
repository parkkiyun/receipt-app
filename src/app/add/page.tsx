'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react'
import { User } from '@supabase/supabase-js'
import imageCompression from 'browser-image-compression'

import ImageInputSimple from '@/components/ImageInput/ImageInputSimple'
import Button from '@/components/ui/Button'
import Loading from '@/components/ui/Loading'
import { Receipt } from '@/types'
import { createReceipt } from '@/lib/api/client-receipts'
import { createClient } from '@/lib/supabase/client'

const STEPS = {
  INPUT: 1,
  PROCESSING: 2,
  CONFIRM: 3,
}

export default function AddReceiptPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [step, setStep] = useState(STEPS.INPUT)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [extractedData, setExtractedData] = useState<Partial<Receipt>>({
    store_name: '',
    total_amount: 0,
    receipt_date: new Date().toISOString().split('T')[0],
    category: 'misc',
    description: '',
    image_url: '',
    raw_text: '',
  })
  
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          router.push('/login');
        } else {
          setUser(currentUser);
        }
      } catch {
        router.push('/login');
      }
    };
    checkUser();
  }, [router, supabase.auth]);
  
  const handleImageUpload = async (file: File) => {
    if (!file || !user) {
      setError('사용자 정보가 없거나 파일이 선택되지 않았습니다.');
      return;
    }

    setStep(STEPS.PROCESSING);
    setError(null);

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      
      const formData = new FormData();
      formData.append('image', compressedFile);

      const ocrResponse = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      if (!ocrResponse.ok) {
        const errorData = await ocrResponse.json();
        throw new Error(errorData.error || 'OCR 처리 실패');
      }

      const ocrData = await ocrResponse.json();
      setExtractedData({
        ...extractedData,
        image_url: ocrData.imageUrl,
        store_name: ocrData.store_name,
        total_amount: ocrData.total_amount,
        raw_text: ocrData.text,
        receipt_date: ocrData.date || new Date().toISOString().split('T')[0],
      });
      setStep(STEPS.CONFIRM);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '영수증 처리에 실패했습니다. 다시 시도해 주세요.';
      setError(errorMessage);
      setStep(STEPS.INPUT);
    }
  };

  const handleDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setExtractedData((prev) => ({
      ...prev,
      [name]: name === 'total_amount' ? Number(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !extractedData.image_url) {
      setError('로그인이 필요하거나 이미지 URL이 없습니다.');
      return;
    }
    
    setIsSubmitting(true)
    setError(null)

    try {
      const receiptToSave: Omit<Receipt, 'id' | 'created_at' | 'updated_at'> = {
        user_id: user.id,
        image_url: extractedData.image_url!,
        store_name: extractedData.store_name || null,
        total_amount: extractedData.total_amount || 0,
        receipt_date: extractedData.receipt_date || new Date().toISOString().split('T')[0],
        category: extractedData.category || 'misc',
        description: extractedData.description || null,
        raw_text: extractedData.raw_text || null,
      }
      await createReceipt(receiptToSave)
      router.push('/')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '저장에 실패했습니다.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (!user) {
    return <div className="flex justify-center items-center h-[calc(100vh-4rem)]"><Loading /></div>;
  }

  return (
    <div className="container max-w-2xl py-8">
      {step !== STEPS.INPUT && (
        <Button variant="ghost" onClick={() => { setStep(STEPS.INPUT); setError(null); }} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> 다시 선택
        </Button>
      )}

      {step === STEPS.INPUT && (
        <div>
          <h1 className="text-3xl font-bold mb-2">영수증 추가</h1>
          <p className="text-gray-600 mb-6">파일을 업로드하여 영수증을 추가하세요.</p>
          <ImageInputSimple onImageSelect={handleImageUpload} />
        </div>
      )}

      {step === STEPS.PROCESSING && (
         <div className="text-center p-8 h-96 flex flex-col justify-center items-center bg-gray-50 rounded-lg">
            <Loading text="영수증을 분석하는 중입니다. 잠시만 기다려주세요..." />
         </div>
      )}

      {step === STEPS.CONFIRM && (
        <form onSubmit={handleSubmit}>
          <h2 className="text-2xl font-bold mb-6">내용 확인 및 수정</h2>
          {extractedData.image_url && (
              <div className="relative mb-6 rounded-lg overflow-hidden border">
                <Image 
                  src={extractedData.image_url} 
                  alt="영수증" 
                  width={500}
                  height={500}
                  className="w-full h-auto"
                />
              </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="store_name" className="block text-sm font-medium text-gray-700 mb-1">가게 이름</label>
              <input type="text" name="store_name" id="store_name" value={extractedData.store_name || ''} onChange={handleDataChange} className="w-full p-2 border rounded-md" />
            </div>
            <div>
              <label htmlFor="total_amount" className="block text-sm font-medium text-gray-700 mb-1">총액</label>
              <input type="number" name="total_amount" id="total_amount" value={extractedData.total_amount || 0} onChange={handleDataChange} className="w-full p-2 border rounded-md" />
            </div>
            <div>
              <label htmlFor="receipt_date" className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
              <input type="date" name="receipt_date" id="receipt_date" value={extractedData.receipt_date || ''} onChange={handleDataChange} className="w-full p-2 border rounded-md" />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
              <select name="category" id="category" value={extractedData.category || 'misc'} onChange={handleDataChange} className="w-full p-2 border rounded-md">
                  <option value="misc">기타</option>
                  <option value="food">식비</option>
                  <option value="transport">교통</option>
                  <option value="shopping">쇼핑</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">적요</label>
              <textarea
                name="description"
                id="description"
                value={extractedData.description || ''}
                onChange={handleDataChange}
                rows={3}
                className="w-full p-2 border rounded-md"
                placeholder="간단한 메모를 남겨보세요 (예: 팀 점심 식사)"
              />
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            저장하기
          </Button>
        </form>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md flex items-center">
            <AlertCircle className="mr-2 h-4 w-4" />
            {error}
        </div>
      )}
    </div>
  )
} 