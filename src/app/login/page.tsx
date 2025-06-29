'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Receipt, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      let result
      
      if (isSignUp) {
        result = await supabase.auth.signUp({
          email,
          password,
        })
      } else {
        result = await supabase.auth.signInWithPassword({
          email,
          password,
        })
      }

      const { error: authError, data } = result
      console.log('Auth result:', { error: authError, data })

      if (authError) {
        console.error('Auth error details:', authError)
        setError(authError.message)
        setIsSubmitting(false)
        return
      }

      router.refresh()
      router.push('/')
    } catch (error) {
      console.error('Unexpected auth error:', error)
      setError('로그인 중 오류가 발생했습니다.')
      setIsSubmitting(false)
      return
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
            <Receipt className="mx-auto h-12 w-12 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900 mt-2">Receipt App</h1>
            <p className="text-gray-600 mt-1">{isSignUp ? '계정을 만드세요.' : '계정에 로그인하세요.'}</p>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="email" className="text-sm font-medium text-gray-700 sr-only">Email address</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="이메일 주소"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                    />
                </div>
                <div className="relative">
                    <label htmlFor="password"className="text-sm font-medium text-gray-700 sr-only">Password</label>
                    <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={isSignUp ? "new-password" : "current-password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="비밀번호"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                    </button>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div>
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isSignUp ? '회원가입' : '로그인'}
                    </Button>
                </div>
            </form>
            <p className="mt-6 text-center text-sm text-gray-600">
                {isSignUp ? '이미 계정이 있으신가요?' : '계정이 없으신가요?'}
                <button onClick={() => setIsSignUp(!isSignUp)} className="font-medium text-primary hover:underline ml-1">
                    {isSignUp ? '로그인' : '회원가입'}
                </button>
            </p>
        </div>
      </div>
    </div>
  )
} 