'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestSupabasePage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setResult('')
    
    try {
      const supabase = createClient()
      console.log('Supabase client created successfully')
      
      // Test basic connection
      const { data, error } = await supabase.from('receipts').select('count').limit(1)
      
      if (error) {
        console.error('Supabase connection error:', error)
        setResult(`Connection Error: ${error.message}`)
      } else {
        console.log('Supabase connection successful:', data)
        setResult('Connection successful!')
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      setResult(`Unexpected error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testAuth = async () => {
    setLoading(true)
    setResult('')
    
    try {
      const supabase = createClient()
      
      // Test auth with dummy credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'testpassword'
      })
      
      console.log('Auth test result:', { data, error })
      
      if (error) {
        setResult(`Auth Error: ${error.message}`)
      } else {
        setResult('Auth test completed (check console for details)')
      }
    } catch (error) {
      console.error('Auth test error:', error)
      setResult(`Auth test error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      
      <div className="space-y-4">
        <button
          onClick={testConnection}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Database Connection'}
        </button>
        
        <button
          onClick={testAuth}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 ml-4"
        >
          {loading ? 'Testing...' : 'Test Auth'}
        </button>
      </div>
      
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <strong>Result:</strong> {result}
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Environment Variables:</h2>
        <div className="bg-gray-100 p-4 rounded">
          <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'}</p>
          <p><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}</p>
        </div>
      </div>
    </div>
  )
}