import { NextRequest, NextResponse } from 'next/server'
import { OCRResult } from '@/types'
import { uploadReceiptImage } from '@/lib/api/storage'
import { getCurrentUserOnServer } from '@/lib/api/server-auth'

// Google Vision API 클라이언트 (서버리스 환경에서는 REST API 사용)
async function processImageWithVision(imageBase64: string): Promise<OCRResult> {
  // Try both server and client side environment variables
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY
  
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

interface ParsedData {
  store_name?: string;
  date?: string;
  time?: string;
  total_amount?: number;
}

function parseOcrText(text: string): ParsedData {
    const lines = text.split('\\n');
    const result: ParsedData = {};
  
    // 가게 이름 (보통 첫 번째 또는 두 번째 줄에 위치)
    const storeNamePatterns = [/점/, /㈜/, /유 /, /가맹점명/];
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
        if (storeNamePatterns.some(p => p.test(lines[i])) && !lines[i].includes('대표')) {
            result.store_name = lines[i].replace(/[^가-힣A-Za-z0-9\s]/g, '').trim();
            break;
        }
    }
    if (!result.store_name && lines.length > 0) {
        result.store_name = lines[0].replace(/[^가-힣A-Za-z0-9\s]/g, '').trim();
    }


    // 날짜 및 시간
    const dateTimeRegex = /(\d{4}[-./]?\s?\d{2}[-./]?\s?\d{2})[\s(]*(\d{2}:\d{2}:\d{2})?/;
    const dateMatches = text.match(dateTimeRegex);
    if (dateMatches) {
        result.date = dateMatches[1].replace(/[./]/g, '-');
        if(dateMatches[2]) {
            result.time = dateMatches[2];
        }
    }

    // 합계 금액
    const amountKeywords = ['합계', '총액', '받을금액', '판매합계', '결제금액'];
    const amountRegex = new RegExp(`(${amountKeywords.join('|')})\\s*([0-9,]+)`);
    const amountMatches = text.match(amountRegex);
    if (amountMatches && amountMatches[2]) {
        result.total_amount = parseInt(amountMatches[2].replace(/,/g, ''), 10);
    } else {
        // 합계 키워드가 없는 경우, 숫자와 쉼표로만 이루어진 가장 큰 금액을 찾음
        const allAmounts = text.match(/[0-9,]+/g)
            ?.map(s => parseInt(s.replace(/,/g, ''), 10))
            .filter(n => !isNaN(n) && n > 100); // 100원 이하는 제외
        if (allAmounts && allAmounts.length > 0) {
            result.total_amount = Math.max(...allAmounts);
        }
    }

    return result;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserOnServer();
    if (!user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: '이미지 파일이 없습니다.' }, { status: 400 });
    }

    const imageUrl = await uploadReceiptImage(file, user.id);
    if (!imageUrl) {
      return NextResponse.json({ error: '이미지 업로드에 실패했습니다.' }, { status: 500 });
    }

    const ocrRequestPayload = {
      images: [
        {
          format: file.type.split('/')[1] || 'png',
          name: file.name,
        },
      ],
      requestId: 'string', // uuid or other unique id
      version: 'V2',
      timestamp: Date.now().toString(),
    };

    const ocrRequestFormData = new FormData();
    ocrRequestFormData.append(
      'message',
      new Blob([JSON.stringify(ocrRequestPayload)], { type: 'application/json' })
    );
    ocrRequestFormData.append('file', file);


    // Check if environment variables are set
    if (!process.env.CLOVA_OCR_API_URL || !process.env.CLOVA_OCR_API_KEY) {
      console.error('CLOVA OCR API URL 또는 키가 설정되지 않았습니다.');
      console.log('Available env vars:', {
        CLOVA_OCR_API_URL: process.env.CLOVA_OCR_API_URL ? 'present' : 'missing',
        CLOVA_OCR_API_KEY: process.env.CLOVA_OCR_API_KEY ? 'present' : 'missing',
        GOOGLE_CLOUD_VISION_API_KEY: process.env.GOOGLE_CLOUD_VISION_API_KEY ? 'present' : 'missing',
        NEXT_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY ? 'present' : 'missing'
      });
      
      // Use Google Vision API as fallback
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = buffer.toString('base64');
      
      try {
        const visionResult = await processImageWithVision(base64Image);
        return NextResponse.json({ 
          store_name: visionResult.store_name,
          total_amount: visionResult.total_amount,
          date: visionResult.receipt_date,
          text: visionResult.text,
          imageUrl
        });
      } catch (visionError) {
        console.error('Google Vision API 오류:', visionError);
        return NextResponse.json({ 
          error: 'OCR API가 설정되지 않았습니다. 환경 변수를 확인해주세요.' 
        }, { status: 500 });
      }
    }

    const ocrApiResponse = await fetch(process.env.CLOVA_OCR_API_URL, {
      method: 'POST',
      headers: {
        'X-OCR-SECRET': process.env.CLOVA_OCR_API_KEY,
      },
      body: ocrRequestFormData,
    });
    
    if (!ocrApiResponse.ok) {
      const errorText = await ocrApiResponse.text();
      console.error('OCR API 응답 오류:', errorText);
      return NextResponse.json({ error: `OCR API 처리 실패: ${errorText}` }, { status: ocrApiResponse.status });
    }

    const ocrData = await ocrApiResponse.json();
    if (!ocrData.images || ocrData.images.length === 0) {
      return NextResponse.json({ error: 'OCR 결과가 없습니다.' }, { status: 500 });
    }

    const text = ocrData.images[0]?.inferResult?.text || '';
    const parsedData = parseOcrText(text);

    return NextResponse.json({ 
      ...parsedData,
      text,
      imageUrl
    });

  } catch (e) {
    console.error('OCR API 오류:', e);
    const errorMessage = e instanceof Error ? e.message : '알 수 없는 서버 오류';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 