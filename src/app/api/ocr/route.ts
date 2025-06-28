import { NextRequest, NextResponse } from 'next/server'
import { OCRResult } from '@/types'

// Google Vision API 클라이언트 (서버리스 환경에서는 REST API 사용)
async function processImageWithVision(imageBase64: string): Promise<OCRResult> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY
  
  if (!apiKey) {
    throw new Error('Google Vision API 키가 설정되지 않았습니다.')
  }

  const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`
  
  const requestBody = {
    requests: [
      {
        image: {
          content: imageBase64
        },
        features: [
          {
            type: 'TEXT_DETECTION',
            maxResults: 1
          }
        ],
        imageContext: {
          languageHints: ['ko', 'en'] // 한국어, 영어 우선
        }
      }
    ]
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Vision API 오류: ${errorData.error?.message || 'Unknown error'}`)
    }

    const result = await response.json()
    
    if (result.responses?.[0]?.error) {
      throw new Error(`Vision API 오류: ${result.responses[0].error.message}`)
    }

    const textAnnotations = result.responses?.[0]?.textAnnotations
    
    if (!textAnnotations || textAnnotations.length === 0) {
      return {
        text: '',
        confidence: 0,
        store_name: undefined,
        total_amount: undefined,
        receipt_date: undefined
      }
    }

    const fullText = textAnnotations[0].description || ''
    const confidence = (textAnnotations[0].confidence || 0.5) * 100

    // 텍스트 파싱
    const parsedData = parseReceiptText(fullText)

    return {
      text: fullText,
      confidence: Math.round(confidence),
      ...parsedData
    }
  } catch (error) {
    console.error('Vision API 처리 오류:', error)
    throw error
  }
}

// 영수증 텍스트 파싱 함수
function parseReceiptText(text: string) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  let store_name: string | undefined
  let total_amount: number | undefined
  let receipt_date: string | undefined

  // 매장명 추출 (첫 번째 줄이 보통 매장명)
  if (lines.length > 0) {
    store_name = lines[0]
  }

  // 금액 추출 (원, 총계, 합계 등의 키워드와 함께 있는 숫자)
  const amountRegex = /(?:총계|합계|계|총액|total|sum)[:\s]*([0-9,]+)\s*원?/gi
  const amountMatch = text.match(amountRegex)
  if (amountMatch) {
    const amountStr = amountMatch[0].replace(/[^\d,]/g, '').replace(/,/g, '')
    total_amount = parseInt(amountStr, 10)
  } else {
    // 대안: 가장 큰 숫자를 금액으로 추정
    const numbers = text.match(/[0-9,]+/g)
    if (numbers) {
      const amounts = numbers
        .map(num => parseInt(num.replace(/,/g, ''), 10))
        .filter(num => num > 100) // 100원 이상인 것만
        .sort((a, b) => b - a)
      
      if (amounts.length > 0) {
        total_amount = amounts[0]
      }
    }
  }

  // 날짜 추출 (YYYY-MM-DD, YYYY/MM/DD, MM/DD 등)
  const datePatterns = [
    /(\d{4})[-.\/](\d{1,2})[-.\/](\d{1,2})/,  // YYYY-MM-DD
    /(\d{1,2})[-.\/](\d{1,2})[-.\/](\d{4})/,  // MM/DD/YYYY
    /(\d{2})[-.\/](\d{1,2})[-.\/](\d{1,2})/   // YY/MM/DD
  ]

  for (const pattern of datePatterns) {
    const match = text.match(pattern)
    if (match) {
      try {
        if (match[0].includes('2024') || match[0].includes('2023') || match[0].includes('2025')) {
          // 4자리 연도가 포함된 경우
          if (pattern === datePatterns[0]) {
            receipt_date = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
          } else if (pattern === datePatterns[1]) {
            receipt_date = `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`
          }
        } else {
          // 2자리 연도인 경우
          if (pattern === datePatterns[2]) {
            const year = parseInt(match[1]) + 2000
            receipt_date = `${year}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
          }
        }
        break
      } catch {
        // 날짜 파싱 실패시 무시
      }
    }
  }

  // 날짜가 없으면 오늘 날짜로 설정
  if (!receipt_date) {
    receipt_date = new Date().toISOString().split('T')[0]
  }

  return {
    store_name,
    total_amount,
    receipt_date
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json(
        { error: '이미지 파일이 필요합니다.' },
        { status: 400 }
      )
    }

    // 파일을 Base64로 변환
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')

    // OCR 처리
    const result = await processImageWithVision(base64Image)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('OCR API 오류:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        success: false 
      },
      { status: 500 }
    )
  }
} 